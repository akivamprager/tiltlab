#!/usr/bin/env python3
"""
predict.py - circuit predictions for Tilt Lab (runs on any computer, needs numpy).

Covers:
  Tirgul 1  KVL, series resistors, power
  Tirgul 2  practical (Thevenin) source model of a GPIO pin, R-2R ladder via
            superposition/Thevenin, checked with node-voltage analysis
  Tirgul 3  LED as a nonlinear element: exact operating point (load line) and
            small-signal resistance r_d = n*V_T / I_D, and when the
            small-signal approximation stops being valid

Usage:
  python3 predict.py                    # default parts
  python3 predict.py --r-led 330 --r-ladder 1000 --vf 1.9
"""
import argparse
import math

import numpy as np

V_T = 0.02585  # thermal voltage at room temperature [V]


# ----------------------------------------------------------------------------
# LED model (Shockley):  I = Is * (exp(V / (n V_T)) - 1)
# ----------------------------------------------------------------------------
class LED:
    def __init__(self, vf_at_5mA=1.85, n=2.0):
        # pick Is so the LED drops vf_at_5mA volts at 5 mA (a typical red LED)
        self.n = n
        self.Is = 5e-3 / (math.exp(vf_at_5mA / (n * V_T)) - 1)

    def current(self, v):
        return self.Is * (math.exp(v / (self.n * V_T)) - 1)

    def voltage(self, i):
        return self.n * V_T * math.log(i / self.Is + 1)

    def r_small_signal(self, i):
        # r_d = (dI/dV)^-1 = n V_T / (I + Is)
        return self.n * V_T / (i + self.Is)


def solve_led_circuit(v_th, r_th, led):
    """Operating point of  v_th -- r_th -- LED -- ground.
    KVL: v_th = I*r_th + V_D(I). Monotonic in I, so bisection is safe."""
    if v_th <= 0:
        return 0.0, 0.0
    lo, hi = 0.0, v_th / r_th
    for _ in range(200):
        mid = (lo + hi) / 2
        if mid * r_th + led.voltage(mid) > v_th:
            hi = mid
        else:
            lo = mid
    i = (lo + hi) / 2
    return i, led.voltage(i)


# ----------------------------------------------------------------------------
# R-2R ladder (3 bit) by node voltages
#   b0 -2R- N0 -R- N1 -R- N2 (=out)
#          |      |      |
#         2R     2R(b1) 2R(b2)
#          |
#         GND
# ----------------------------------------------------------------------------
def ladder_nodal(bits, R, vdd, r_gpio=0.0, load=None, led=None):
    """Solve the 3 node voltages [N0, N1, N2].
    bits = (b0, b1, b2). Each GPIO is a practical source: vdd*b in series with
    r_gpio. load: None (open circuit), or 'led' to hang an LED from N2 to GND
    (solved with Newton's method, since the LED makes the equations nonlinear)."""
    g2 = 1.0 / (2 * R + r_gpio)   # leg from a GPIO
    gR = 1.0 / R
    gT = 1.0 / (2 * R)            # termination to ground
    b0, b1, b2 = bits
    G = np.array([
        [g2 + gT + gR, -gR, 0],
        [-gR, 2 * gR + g2, -gR],
        [0, -gR, gR + g2],
    ])
    I = np.array([g2 * vdd * b0, g2 * vdd * b1, g2 * vdd * b2])
    v = np.linalg.solve(G, I)
    if load != 'led':
        return v
    # Newton iteration on the KCL equations with the LED current at N2
    for _ in range(100):
        f = G @ v - I
        f[2] += led.current(v[2])
        J = G.copy()
        J[2, 2] += led.current(v[2]) / (led.n * V_T)  # dI/dV of the LED
        step = np.linalg.solve(J, f)
        # damp large steps so exp() can't blow up
        step = np.clip(step, -0.1, 0.1)
        v = v - step
        if np.max(np.abs(step)) < 1e-12:
            break
    return v


def ladder_thevenin_numeric(R, r_gpio=0.0):
    """R_th seen from N2: all GPIO sources off (set to 0 V), inject 1 A test current."""
    g2 = 1.0 / (2 * R + r_gpio)
    gR = 1.0 / R
    gT = 1.0 / (2 * R)
    G = np.array([
        [g2 + gT + gR, -gR, 0],
        [-gR, 2 * gR + g2, -gR],
        [0, -gR, gR + g2],
    ])
    v = np.linalg.solve(G, np.array([0, 0, 1.0]))
    return v[2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vdd', type=float, default=3.3, help='GPIO high level [V]')
    ap.add_argument('--r-gpio', type=float, default=25.0,
                    help='GPIO output resistance estimate [ohm] (measure it! see guide)')
    ap.add_argument('--vf', type=float, default=1.85, help='LED forward voltage at 5 mA [V]')
    ap.add_argument('--n', type=float, default=2.0, help='LED ideality factor')
    ap.add_argument('--r-led', type=float, nargs='*', default=[220, 330, 470, 1000])
    ap.add_argument('--r-ladder', type=float, default=1000.0, help='R in the R-2R ladder [ohm]')
    a = ap.parse_args()
    led = LED(a.vf, a.n)

    print('=' * 72)
    print('1) LED BAR: GPIO (practical source) -> R -> LED')
    print('   GPIO Thevenin model: V_th = %.2f V, R_out = %.0f ohm' % (a.vdd, a.r_gpio))
    print('   LED model: Is = %.3g A, n = %.1f' % (led.Is, led.n))
    print('=' * 72)
    print('%8s | %8s | %8s | %8s | %9s | %8s | %8s' %
          ('R [ohm]', 'I exact', 'V_LED', 'I (2V)', 'r_d [ohm]', 'P_R [mW]', 'P_LED'))
    for r in a.r_led:
        i, vd = solve_led_circuit(a.vdd, r + a.r_gpio, led)
        i_const = max(0.0, (a.vdd - 2.0) / (r + a.r_gpio))  # constant-voltage-drop model
        print('%8.0f | %6.2f mA | %6.3f V | %6.2f mA | %9.1f | %8.2f | %5.2f mW' %
              (r, i * 1e3, vd, i_const * 1e3, led.r_small_signal(i), i * i * r * 1e3, i * vd * 1e3))
    print('   (Pi rule of thumb: keep each pin <= ~16 mA and the total small.)')

    print()
    print('=' * 72)
    print('2) R-2R DAC, R = %.0f ohm, 2R = %.0f ohm' % (a.r_ladder, 2 * a.r_ladder))
    print('=' * 72)
    R = a.r_ladder
    rth_ideal = ladder_thevenin_numeric(R, 0.0)
    rth_real = ladder_thevenin_numeric(R, a.r_gpio)
    print('   R_th from node analysis: %.1f ohm (ideal GPIO), %.1f ohm (with R_out)'
          ' -> theory says R_th = R = %.0f' % (rth_ideal, rth_real, R))
    print()
    print('%4s %5s | %9s | %9s | %9s | %10s | %10s' %
          ('code', 'bits', 'Vth theory', 'V nodal', 'V nodal+', 'I_LED Thev', 'I_LED nodal'))
    print('%4s %5s | %9s | %9s | %9s | %10s | %10s' %
          ('', 'b2b1b0', '=Vdd*D/8', '(ideal)', '(R_out)', 'load line', '(Newton)'))
    for code in range(8):
        bits = (code & 1, (code >> 1) & 1, (code >> 2) & 1)
        v_theory = a.vdd * code / 8
        v_ideal = ladder_nodal(bits, R, a.vdd)[2]
        v_real = ladder_nodal(bits, R, a.vdd, a.r_gpio)[2]
        i_thev, _ = solve_led_circuit(v_theory, R, led)
        v_led = ladder_nodal(bits, R, a.vdd, 0.0, 'led', led)[2]
        i_nodal = led.current(v_led)
        print('%4d  %d%d%d  | %8.3f V | %8.3f V | %8.3f V | %7.3f mA | %7.3f mA' %
              (code, bits[2], bits[1], bits[0], v_theory, v_ideal, v_real,
               i_thev * 1e3, i_nodal * 1e3))
    print('   Note the dead zone: the LED barely conducts until V_th passes ~1.6-1.7 V.')

    print()
    print('=' * 72)
    print('3) SMALL-SIGNAL CHECK (tirgul 3) around DAC code 6')
    print('=' * 72)
    v0 = a.vdd * 6 / 8
    i0, vd0 = solve_led_circuit(v0, R, led)
    rd = led.r_small_signal(i0)
    print('   operating point: V_th = %.3f V, I_D = %.3f mA, V_D = %.3f V, r_d = %.1f ohm'
          % (v0, i0 * 1e3, vd0, rd))
    print('   %10s | %12s | %12s | %8s' % ('dV_th', 'dI linear', 'dI exact', 'error'))
    for dv in [0.01, 0.05, 0.1, a.vdd / 8, -a.vdd / 8]:
        di_lin = dv / (R + rd)
        i1, _ = solve_led_circuit(v0 + dv, R, led)
        di = i1 - i0
        print('   %+8.3f V | %+9.4f mA | %+9.4f mA | %6.2f %%' %
              (dv, di_lin * 1e3, di * 1e3, 100 * abs(di_lin - di) / abs(di)))
    print('   Small-signal model: the LED acts like a resistor r_d, so dI = dV / (R_th + r_d).')
    print('   It holds while dV_D << n*V_T = %.0f mV.' % (led.n * V_T * 1e3))


if __name__ == '__main__':
    main()
