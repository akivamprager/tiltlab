#!/usr/bin/env python3
"""
calc.py - the circuit's numbers, from the same equations as the guide (Python standard library only).

  python3 calc.py                          # the values in the guide: 9 V, 47 ohm, 1 kohm, 1000 uF
  python3 calc.py --VB 8.6                 # with the battery voltage you measured
  python3 calc.py --C 2200e-6              # with a bigger capacitor

Model (tirgul 3): the lit LED is a constant voltage V_f. Then
  switch closed: battery + R1 is a practical source charging C (Thevenin, tirgul 2)
  switch open:   C discharges through R2 and the LED:  v_C(t) - V_f = (v0 - V_f) e^(-t/tau),  tau = R2*C
"""
import argparse
import math


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--VB', type=float, default=9.0, help='battery voltage [V] (default 9 = one 9 V battery)')
    ap.add_argument('--R1', type=float, default=47.0, help='charging resistor [ohm]')
    ap.add_argument('--R2', type=float, default=1000.0, help='LED resistor [ohm]')
    ap.add_argument('--C', type=float, default=1000e-6, help='capacitor [F] (1000 uF = 1000e-6)')
    ap.add_argument('--Vf', type=float, default=1.8, help='LED voltage when lit [V] (red: about 1.8)')
    ap.add_argument('--i-off', type=float, default=0.5e-3, help='current at which the LED looks off [A]')
    a = ap.parse_args()

    if a.VB <= a.Vf:
        raise SystemExit('The battery (%.2f V) must be above the LED voltage (%.2f V), or the LED never lights.' % (a.VB, a.Vf))

    # switch closed, steady state: no current into C, so R1, R2 and the LED are in series (KVL)
    i_on = (a.VB - a.Vf) / (a.R1 + a.R2)
    v0 = a.Vf + i_on * a.R2                    # = voltage on C, and on the R2 + LED branch
    # charging: C sees the Thevenin equivalent of the rest, R_th = R1 || R2
    r_th = a.R1 * a.R2 / (a.R1 + a.R2)
    tau_charge = r_th * a.C
    # switch open: KCL at the capacitor node, C dv/dt = -(v - V_f)/R2
    tau = a.R2 * a.C
    i0 = (v0 - a.Vf) / a.R2
    t_off = tau * math.log(i0 / a.i_off) if i0 > a.i_off else 0.0

    print('Inputs: V_B = %.2f V, R1 = %g ohm, R2 = %g ohm, C = %g uF, V_f = %.2f V' % (a.VB, a.R1, a.R2, a.C * 1e6, a.Vf))
    print()
    print('Switch closed (steady state)')
    print('  LED current        i = (V_B - V_f)/(R1 + R2)   = %.2f mA' % (i_on * 1e3))
    print('  capacitor voltage  v0 = V_f + i*R2             = %.2f V' % v0)
    print('  charging time const  (R1 || R2)*C              = %.0f ms  (charges in ~%.0f ms)' % (tau_charge * 1e3, 5 * tau_charge * 1e3))
    print()
    print('Switch open (discharge through R2 + LED)')
    print('  time constant      tau = R2*C                  = %.2f s' % tau)
    print('  LED current        i(t) = %.2f mA * e^(-t/%.2f s)' % (i0 * 1e3, tau))
    print('  LED looks off at %.1f mA after  t = tau*ln(i0/i_off) = %.1f s' % (a.i_off * 1e3, t_off))
    print()
    print('  t [s]   v_C [V]   i [mA]')
    for k in range(0, 6):
        t = k * tau / 2
        print('  %5.2f   %6.2f   %6.2f' % (t, a.Vf + (v0 - a.Vf) * math.exp(-t / tau), i0 * 1e3 * math.exp(-t / tau)))


if __name__ == '__main__':
    main()
