"""
filters.py - "virtual circuits" that the tilt signal passes through.

The input x(t) is the tilt angle in degrees; treat it as a voltage source v_in(t).
The output is the voltage on the capacitor, v_C(t).

  RCFilter    tirgul 4:  RC v_C' + v_C = v_in               (tau = RC)
  ConvRC      tirgul 5:  y = x * h,  h(t) = (1/tau) e^{-t/tau} u(t)
  RLCFilter   tirgul 6:  LC v_C'' + RC v_C' + v_C = v_in    (series RLC)
                         alpha = R / 2L,  w0 = 1/sqrt(LC)
"""
import math
from collections import deque


class RCFilter:
    """First-order RC low-pass, solved exactly between samples.

    With v_in held constant during one step dt, the ODE solution is
        v_C(t+dt) = v_in + (v_C(t) - v_in) e^{-dt/tau}
    which is the tirgul-4 formula  y(t) = y_inf + (y_0 - y_inf) e^{-t/tau}.
    """

    def __init__(self, R, C):
        self.R, self.C = R, C
        self.tau = R * C
        self.y = None

    def step(self, x, dt):
        if self.y is None:          # start in steady state (no initial jump)
            self.y = x
        k = math.exp(-dt / self.tau)
        self.y = x + (self.y - x) * k
        return self.y

    def describe(self):
        return 'RC low-pass: R=%g, C=%g  ->  tau = RC = %.3f s' % (self.R, self.C, self.tau)


class ConvRC:
    """The same RC filter, computed as a convolution sum (tirgul 5).

        y(t) = integral_0^inf h(tau') x(t - tau') dtau'
             ~ sum_k  h(k dt) dt  x[n - k]

    The weights w_k = (1 - e^{-dt/tau}) e^{-k dt/tau} are h(k dt) * dt to first
    order in dt/tau (and make this filter match RCFilter exactly). The sum is
    cut off after 6 tau, where e^{-6} = 0.25% is left out.
    Convolution needs evenly spaced samples, so it uses the nominal dt.
    """

    def __init__(self, R, C, dt):
        self.R, self.C, self.dt = R, C, dt
        self.tau = R * C
        a = 1 - math.exp(-dt / self.tau)
        n = max(1, int(math.ceil(6 * self.tau / dt)))
        self.w = [a * math.exp(-k * dt / self.tau) for k in range(n)]
        self.buf = deque(maxlen=n)   # buf[0] is the newest sample

    def step(self, x, dt=None):
        if not self.buf:             # pretend the input was x forever (steady state)
            self.buf.extend([x] * self.buf.maxlen)
        self.buf.appendleft(x)
        s = 0.0
        for wk, xk in zip(self.w, self.buf):
            s += wk * xk
        return s

    def describe(self):
        return ('Convolution with h(t)=(1/tau)e^{-t/tau}u(t): tau=%.3f s, %d taps (%.1f s of memory)'
                % (self.tau, len(self.w), len(self.w) * self.dt))


class RLCFilter:
    """Series RLC driven by v_in, output v_C.

    State: i (inductor current, continuous) and v_C (capacitor voltage, continuous).
        L di/dt   = v_in - R i - v_C
        C dvC/dt  = i
    Integrated with RK4 and several substeps per sample.
    """

    def __init__(self, R, L, C, substeps=8):
        self.R, self.L, self.C = R, L, C
        self.alpha = R / (2 * L)
        self.w0 = 1 / math.sqrt(L * C)
        self.zeta = self.alpha / self.w0
        self.Q = 1 / (2 * self.zeta) if self.zeta > 0 else float('inf')
        self.substeps = substeps
        self.vc = None
        self.i = 0.0

    @property
    def regime(self):
        if self.alpha == 0:
            return 'undamped'
        if abs(self.alpha - self.w0) < 0.01 * self.w0:   # within 1%: you can't tell apart
            return 'critically damped'
        return 'overdamped' if self.alpha > self.w0 else 'underdamped'

    def _deriv(self, i, vc, vin):
        return (vin - self.R * i - vc) / self.L, i / self.C

    def step(self, x, dt):
        if self.vc is None:
            self.vc = x
        h = dt / self.substeps
        i, vc = self.i, self.vc
        for _ in range(self.substeps):
            k1i, k1v = self._deriv(i, vc, x)
            k2i, k2v = self._deriv(i + h / 2 * k1i, vc + h / 2 * k1v, x)
            k3i, k3v = self._deriv(i + h / 2 * k2i, vc + h / 2 * k2v, x)
            k4i, k4v = self._deriv(i + h * k3i, vc + h * k3v, x)
            i += h / 6 * (k1i + 2 * k2i + 2 * k3i + k4i)
            vc += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v)
        self.i, self.vc = i, vc
        return vc

    def describe(self):
        s = ('Series RLC: R=%g, L=%g, C=%g -> alpha=%.3f 1/s, w0=%.3f rad/s, zeta=%.3f, Q=%.2f  [%s]'
             % (self.R, self.L, self.C, self.alpha, self.w0, self.zeta, self.Q, self.regime))
        if self.alpha < self.w0:
            wd = math.sqrt(self.w0 ** 2 - self.alpha ** 2)
            s += '\n  damped frequency wd=%.3f rad/s (period %.2f s)' % (wd, 2 * math.pi / wd)
        s += '\n  critical damping at R = 2 sqrt(L/C) = %.3f' % (2 * math.sqrt(self.L / self.C))
        return s


class Passthrough:
    def step(self, x, dt):
        return x

    def describe(self):
        return 'raw (no filter)'
