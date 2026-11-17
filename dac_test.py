#!/usr/bin/env python3
"""
dac_test.py - steps the optional R-2R DAC through codes 0..7 (2 s each) so you can
watch the DAC LED and measure node N2 with a multimeter.

  python3 dac_test.py              # default pins b0=16, b1=20, b2=21
  python3 dac_test.py --hold 5     # stay on code 5
"""
import argparse
import time

from gpiozero import LED

ap = argparse.ArgumentParser()
ap.add_argument('--pins', type=int, nargs=3, default=[16, 20, 21], help='b0 b1 b2 (BCM)')
ap.add_argument('--vdd', type=float, default=3.3)
ap.add_argument('--hold', type=int, help='output one code and wait')
ap.add_argument('--seconds', type=float, default=2.0)
a = ap.parse_args()
bits = [LED(p) for p in a.pins]


def out(code):
    for k, b in enumerate(bits):
        b.on() if (code >> k) & 1 else b.off()
    print('code %d  bits b2b1b0 = %d%d%d  ->  predicted open-circuit V_N2 = %.3f V'
          % (code, (code >> 2) & 1, (code >> 1) & 1, code & 1, a.vdd * code / 8))


try:
    if a.hold is not None:
        out(a.hold)
        input('Holding. Press Enter to stop.')
    else:
        while True:
            for c in range(8):
                out(c)
                time.sleep(a.seconds)
except KeyboardInterrupt:
    pass
finally:
    for b in bits:
        b.off()
