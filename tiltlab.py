#!/usr/bin/env python3
"""
tiltlab.py - LED spirit level whose bubble moves through a virtual RC / RLC circuit.

  python3 tiltlab.py                               # raw tilt, LED bar + DAC
  python3 tiltlab.py --mode rc   --R 1 --C 0.3     # RC low-pass, tau = 0.3 s
  python3 tiltlab.py --mode conv --R 1 --C 0.3     # same filter as a convolution
  python3 tiltlab.py --mode rlc  --R 1 --L 1 --C 0.1   # underdamped: bubble sloshes
  python3 tiltlab.py --mode rlc  --R 6.32 --L 1 --C 0.1  # critically damped
  python3 tiltlab.py --mode rlc  --R 20 --L 1 --C 0.1    # overdamped
  python3 tiltlab.py --sim ...                     # no hardware: fake sensor, terminal only
  add  --log run.csv  to record data for analyze.py
  add  --dashboard     to serve live graphs: open http://<pi-name>.local:8000 on your laptop
  python3 tiltlab.py --sim --dashboard             # rehearse on the laptop itself: http://localhost:8000

Wiring (BCM numbers, see the build guide):
  accelerometer: SDA=GPIO2, SCL=GPIO3, VCC=3.3V, GND
  LED bar:       GPIO 17, 27, 22, 23, 24  (each through its resistor to an LED, LED to GND)
  R-2R DAC bits: b0=GPIO16, b1=GPIO20, b2=GPIO21
"""
import argparse
import math
import socket
import subprocess
import sys
import time

import accel
import filters


def parse_args():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--mode', choices=['raw', 'rc', 'conv', 'rlc'], default='raw')
    ap.add_argument('--R', type=float, default=1.0, help='virtual resistance [ohm]')
    ap.add_argument('--L', type=float, default=1.0, help='virtual inductance [H]')
    ap.add_argument('--C', type=float, default=0.3, help='virtual capacitance [F]')
    ap.add_argument('--rate', type=float, default=100.0, help='sample rate [Hz]')
    ap.add_argument('--axis', choices=['roll', 'pitch'], default='roll')
    ap.add_argument('--range', type=float, default=30.0, help='tilt [deg] that reaches the end of the bar')
    ap.add_argument('--leds', type=int, nargs='*', default=[17, 27, 22, 23, 24], help='LED bar GPIOs, left to right')
    ap.add_argument('--dac', type=int, nargs='*', default=[16, 20, 21], help='DAC bit GPIOs, LSB first ("--dac" alone = none)')
    ap.add_argument('--dac-min', type=int, default=0, help='lowest DAC code used (try 4, see guide)')
    ap.add_argument('--no-pwm', action='store_true', help='on/off LEDs instead of a smooth PWM bubble')
    ap.add_argument('--zero', action='store_true', help='average 1 s at start and treat it as level')
    ap.add_argument('--log', help='CSV file to record t, accel, raw and filtered angle')
    ap.add_argument('--duration', type=float, default=0, help='stop after N seconds (0 = run until Ctrl+C)')
    ap.add_argument('--sim', action='store_true', help='simulated sensor, no GPIO')
    ap.add_argument('--dashboard', type=int, nargs='?', const=8000, default=None, metavar='PORT',
                    help='serve the live dashboard (default port 8000)')
    ap.add_argument('--r-led', type=float, default=330.0, help='LED bar resistor [ohm], shown on the dashboard')
    ap.add_argument('--quiet', action='store_true', help='no terminal bar')
    return ap.parse_args()


def tilt_deg(ax, ay, az, axis):
    if axis == 'roll':
        return math.degrees(math.atan2(ay, az))
    return math.degrees(math.atan2(-ax, math.sqrt(ay * ay + az * az)))


def make_filter(p, dt, y0=None, history=None):
    """Build the virtual circuit for params p = {mode, R, L, C}.
    y0: current output, so switching circuits doesn't make the bubble jump.
    history: recent raw inputs (oldest first) - a convolution's only "state"."""
    mode = p['mode']
    if mode == 'rc':
        f = filters.RCFilter(p['R'], p['C'])
        f.y = y0
    elif mode == 'conv':
        f = filters.ConvRC(p['R'], p['C'], dt)
        if history:
            f.buf.extend(reversed(history[-f.buf.maxlen:]))
    elif mode == 'rlc':
        f = filters.RLCFilter(p['R'], p['L'], p['C'])
        f.vc = y0
    else:
        f = filters.Passthrough()
    return f


KNOWN_LINKS = {'10.42.0.1': 'TiltLab Wi-Fi', '10.55.0.1': 'USB cable'}   # set up by pi/setup_pi.sh


def lan_addresses():
    """Addresses a browser can use to reach this machine, as (address, note) pairs."""
    host = socket.gethostname()
    names = [host if host.endswith('.local') else host + '.local']
    try:                                       # every IPv4 address (Linux / the Pi)
        out = subprocess.run(['hostname', '-I'], capture_output=True, text=True, timeout=2).stdout
        names += [ip for ip in out.split() if ':' not in ip]
    except (OSError, subprocess.SubprocessError):
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))       # no packet is sent; just picks the LAN interface
        ip = s.getsockname()[0]
        s.close()
        if ip not in names:
            names.append(ip)
    except OSError:
        pass
    return [(n, KNOWN_LINKS.get(n, '')) for n in names]


def bubble_levels(theta, rng, n):
    """Brightness of each of n LEDs. The bubble sits at a fractional position and
    is shared between the two nearest LEDs, so it glides instead of jumping."""
    p = (max(-1.0, min(1.0, theta / rng)) + 1) / 2 * (n - 1)
    lv = [0.0] * n
    k = int(math.floor(p))
    f = p - k
    lv[k] = 1 - f
    if k + 1 < n:
        lv[k + 1] = f
    return lv


def dac_code(theta, rng, bits, lo=0):
    """|tilt| -> DAC code in [lo, full]. With lo=0 the LED is dark for small tilts
    (LED threshold); lo=4 starts the scale right at the threshold."""
    full = (1 << bits) - 1
    frac = min(1.0, abs(theta) / rng)
    return max(0, min(full, lo + int(round(frac * (full - lo)))))


class Hardware:
    def __init__(self, a):
        from gpiozero import LED, PWMLED
        self.pwm = not a.no_pwm
        self.leds = [PWMLED(p) if self.pwm else LED(p) for p in a.leds]
        self.bits = [LED(p) for p in a.dac]

    def show(self, levels, code):
        for led, v in zip(self.leds, levels):
            if self.pwm:
                led.value = v
            elif v >= 0.5:
                led.on()
            else:
                led.off()
        for k, b in enumerate(self.bits):
            b.on() if (code >> k) & 1 else b.off()

    def close(self):
        for d in self.leds + self.bits:
            d.off()
            d.close()


def terminal_bar(theta_raw, theta_f, levels, code, nbits):
    shades = ' .:-=+*#@'
    bar = ''.join(shades[int(round(v * (len(shades) - 1)))] for v in levels)
    return '\r[%s]  raw %+6.1f  filtered %+6.1f deg  DAC %d/%d ' % (
        bar, theta_raw, theta_f, code, (1 << nbits) - 1)


def main():
    a = parse_args()
    if a.sim:
        sensor = accel.FakeAccel(manual=a.dashboard is not None)
        hw = None
    else:
        sensor, addr = accel.detect()
        print('Found %s at I2C address 0x%02X' % (sensor.name, addr))
        hw = Hardware(a)
    dt_nom = 1.0 / a.rate
    params = {'mode': a.mode, 'R': a.R, 'L': a.L, 'C': a.C}
    filt = make_filter(params, dt_nom)
    print('Mode:', filt.describe())
    nbits = max(1, len(a.dac))

    shared = None
    if a.dashboard is not None:
        import dashboard_server
        shared = dashboard_server.Shared(params, {
            'sensor': sensor.name, 'rate': a.rate, 'leds': len(a.leds), 'range': a.range,
            'dacBits': len(a.dac), 'dacMin': a.dac_min, 'rLed': a.r_led, 'sim': a.sim, 'axis': a.axis})
        if a.sim:
            shared.sim = sensor
        dashboard_server.start(shared, a.dashboard)
        print('Dashboard running. Open one of these in a browser on the same network:')
        for n, note in lan_addresses():
            print('   http://%s:%d%s' % (n, a.dashboard, '   (%s)' % note if note else ''))
        if a.sim:
            print('   http://localhost:%d   (this computer)' % a.dashboard)
        a.quiet = True

    offset = 0.0
    if a.zero:
        print('Hold it level... ', end='', flush=True)
        vals = []
        t_end = time.monotonic() + 1.0
        while time.monotonic() < t_end:
            vals.append(tilt_deg(*sensor.read(), a.axis))
            time.sleep(1.0 / a.rate)
        offset = sum(vals) / len(vals)
        print('offset %.2f deg' % offset)

    log = None
    if a.log:
        log = open(a.log, 'w')
        log.write('# mode=%s R=%g L=%g C=%g rate=%g axis=%s range=%g sensor=%s\n'
                  % (a.mode, a.R, a.L, a.C, a.rate, a.axis, a.range, sensor.name))
        log.write('t,ax,ay,az,theta_raw,theta_filt,dac\n')

    history = []                        # recent raw angles, for switching to convolution
    t0 = time.monotonic()
    t_prev = t0
    next_tick = t0
    late = 0
    thf = None
    try:
        while True:
            if shared:
                p = shared.take_pending()
                if p:
                    filt = make_filter(p, dt_nom, y0=thf, history=history)
                    shared.set_params(p)
                    print('Mode:', filt.describe())
            ax, ay, az = sensor.read()
            now = time.monotonic()
            dt = now - t_prev if now > t_prev else dt_nom
            t_prev = now
            th = tilt_deg(ax, ay, az, a.axis) - offset
            history.append(th)
            if len(history) > 4000:
                del history[:1000]
            thf = filt.step(th, dt)
            levels = bubble_levels(thf, a.range, len(a.leds))
            code = dac_code(thf, a.range, nbits, a.dac_min)
            if hw:
                hw.show(levels, code)
            if shared:
                shared.push(now - t0, th, thf, code)
            if log:
                log.write('%.4f,%.4f,%.4f,%.4f,%.3f,%.3f,%d\n' % (now - t0, ax, ay, az, th, thf, code))
            if not a.quiet:
                sys.stdout.write(terminal_bar(th, thf, levels, code, nbits))
                sys.stdout.flush()
            if a.duration and now - t0 >= a.duration:
                break
            next_tick += dt_nom
            sleep = next_tick - time.monotonic()
            if sleep > 0:
                time.sleep(sleep)
            else:
                late += 1
                next_tick = time.monotonic()
    except KeyboardInterrupt:
        pass
    finally:
        print()
        if late > 0.05 * (time.monotonic() - t0) * a.rate:
            print('Note: the loop missed its deadline %d times; try a lower --rate.' % late)
        if log:
            log.close()
            print('Saved', a.log)
        if hw:
            hw.close()


if __name__ == '__main__':
    main()
