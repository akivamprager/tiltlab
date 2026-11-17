#!/usr/bin/env python3
"""
analyze.py - compare a logged run with circuit theory (needs numpy + matplotlib).

  python3 analyze.py run.csv            -> run.png and run_report.txt

What it checks:
  1. Tirgul 5:   y = x * h.  Convolves your *measured* raw tilt with the theoretical
                 h(t) and overlays it on what the Pi actually output.
  2. Tirgul 4/6: finds the biggest step you made, overlays the closed-form step
                 response, and measures tau (RC) or alpha and w_d (RLC) from the data.
  3. Tirgul 5:   if you tapped the board, compares the response with A*h(t),
                 where A = area of the tap pulse (a tap is roughly an impulse).

For clean results: hold still >= 3 s, make one quick tilt (step), hold still >= 4 s,
then tap the table/board once sharply and hold still again.
"""
import math
import sys

import numpy as np


def load(path):
    meta = {}
    with open(path) as f:
        first = f.readline()
    for tok in first.lstrip('#').split():
        if '=' in tok:
            k, v = tok.split('=', 1)
            try:
                meta[k] = float(v)
            except ValueError:
                meta[k] = v
    d = np.genfromtxt(path, delimiter=',', names=True, skip_header=1)
    return meta, d


class Model:
    """Theoretical impulse and step responses of the virtual circuit (output v_C)."""

    def __init__(self, meta):
        self.mode = meta['mode']
        R, L, C = meta['R'], meta['L'], meta['C']
        if self.mode in ('rc', 'conv'):
            self.tau = R * C
        elif self.mode == 'rlc':
            self.L = L
            self.alpha = R / (2 * L)
            self.w0 = 1 / math.sqrt(L * C)
            if abs(self.alpha - self.w0) < 0.01 * self.w0:
                self.kind = 'critical'
            elif self.alpha < self.w0:
                self.kind = 'under'
                self.wd = math.sqrt(self.w0 ** 2 - self.alpha ** 2)
            else:
                self.kind = 'over'
                r = math.sqrt(self.alpha ** 2 - self.w0 ** 2)
                self.s1, self.s2 = -self.alpha + r, -self.alpha - r

    def h(self, t):
        t = np.asarray(t, float)
        u = (t >= 0).astype(float)
        t = np.maximum(t, 0)
        if self.mode in ('rc', 'conv'):
            return u * np.exp(-t / self.tau) / self.tau
        a, w0 = self.alpha, self.w0
        if self.kind == 'under':
            return u * w0 ** 2 / self.wd * np.exp(-a * t) * np.sin(self.wd * t)
        if self.kind == 'critical':
            return u * w0 ** 2 * t * np.exp(-a * t)
        return u * w0 ** 2 / (self.s1 - self.s2) * (np.exp(self.s1 * t) - np.exp(self.s2 * t))

    def step(self, t, y0, yinf):
        """Response to a step from y0 to yinf at t=0, starting at rest (y'=0)."""
        t = np.maximum(np.asarray(t, float), 0)
        if self.mode in ('rc', 'conv'):
            g = np.exp(-t / self.tau)
        elif self.kind == 'under':
            a, wd = self.alpha, self.wd
            g = np.exp(-a * t) * (np.cos(wd * t) + a / wd * np.sin(wd * t))
        elif self.kind == 'critical':
            g = np.exp(-self.alpha * t) * (1 + self.alpha * t)
        else:
            s1, s2 = self.s1, self.s2
            g = (s2 * np.exp(s1 * t) - s1 * np.exp(s2 * t)) / (s2 - s1)
        return yinf + (y0 - yinf) * g

    def label(self):
        if self.mode in ('rc', 'conv'):
            return 'RC, tau = %.3f s' % self.tau
        return 'RLC (%s-damped), alpha = %.3f 1/s, w0 = %.3f rad/s' % (self.kind, self.alpha, self.w0)


def convolve_measured(t, x, model):
    """y = x * h for the measured samples.

    The Pi holds each sample x_k constant over (t_{k-1}, t_k]. Convolving h with
    such a staircase can be done exactly: by linearity and time invariance the
    staircase is a sum of shifted steps, so
        y(t_n) = x_0 (1 - S(t_n - t_0)) + sum_k x_k [S(t_n - t_{k-1}) - S(t_n - t_k)]
    where S(t) = integral_0^t h is the unit step response. The first term is the
    input before logging started (assumed to sit at x_0 forever)."""
    S = lambda tau: model.step(tau, 0.0, 1.0)
    y = np.empty_like(x)
    for n in range(len(t)):
        tn = t[n]
        acc = x[0] * (1 - S(tn - t[0]))
        if n > 0:
            acc += np.sum(x[1:n + 1] * (S(tn - t[0:n]) - S(tn - t[1:n + 1])))
        y[n] = acc
    return y


def find_step(t, x, fs):
    """Biggest quick change: compare the mean of a window before vs after each point."""
    w = int(0.4 * fs)
    gap = int(0.25 * fs)
    idx = np.arange(w + gap, len(x) - w - gap)
    if len(idx) == 0:
        return None
    cs = np.concatenate([[0], np.cumsum(x)])
    after = (cs[idx + gap + w] - cs[idx + gap]) / w
    before = (cs[idx - gap] - cs[idx - gap - w]) / w
    d = after - before
    big = np.max(np.abs(d))
    if big < 3:
        return None
    # d is flat-topped around the step; take the middle of the first plateau
    run = np.flatnonzero(np.abs(d) >= 0.95 * big)
    first = run[:np.argmax(np.diff(np.append(run, run[-1] + 2)) > 1) + 1]
    bi = idx[first[len(first) // 2]]
    y0 = np.median(x[max(0, bi - gap - int(1.5 * fs)):bi - gap])
    yinf = np.median(x[bi + gap:min(len(x), bi + gap + int(2.5 * fs))])
    mid = (y0 + yinf) / 2
    lo, hi = max(1, bi - gap - w), min(len(x) - 1, bi + gap + w)
    xs = np.convolve(x, np.ones(3) / 3, mode='same')   # light smoothing vs noise
    sgn = np.sign(yinf - y0)
    k = next(j for j in range(lo, hi) if sgn * (xs[j] - mid) >= 0)
    k = max(0, k - 1)   # each sample is held over the interval before it, so the step starts at t[k-1]
    return t[k], y0, yinf, k


def find_tap(t, x, fs, after=0):
    """A tap = a short spike (< ~100 ms) far from the local median."""
    n = len(x)
    if n < fs:
        return None
    half = int(0.5 * fs)
    base = np.array([np.median(x[max(0, i - half):i + half]) for i in range(n)])
    r = x - base
    noise = 1.4826 * np.median(np.abs(r)) + 1e-9
    i = int(np.argmax(np.abs(r[after:]))) + after
    if abs(r[i]) < 8 * noise or abs(r[i]) < 3:
        return None
    lo, hi = i, i
    while lo > 0 and abs(r[lo - 1]) > 3 * noise:
        lo -= 1
    while hi < n - 1 and abs(r[hi + 1]) > 3 * noise:
        hi += 1
    if t[hi] - t[lo] > 0.15:
        return None
    dt = np.diff(t, append=t[-1] + 1 / fs)
    area = np.sum(r[lo:hi + 1] * dt[lo:hi + 1])
    return t[lo], area, base[i], lo, hi


def measure_params(t, x, y, ts, yinf, model, y0):
    """Read the circuit parameters back out of the measured step response."""
    out = []
    e0 = y0 - yinf
    # use the data only until the input moves again (next step or a tap)
    k0 = np.searchsorted(t, ts)
    end = len(t)
    for j in range(k0 + int(0.3 / np.median(np.diff(t))), len(t)):
        if abs(x[j] - yinf) > max(3.0, 0.25 * abs(e0)):
            end = j
            break
    tt, e = t[k0:end] - ts, y[k0:end] - yinf
    out.append('(using %.1f s of data after the step, until the input moved again)' % tt[-1])
    if model.mode in ('rc', 'conv'):
        # time for the error to fall to e0 / e  (63.2% of the way)
        k = np.argmax(np.abs(e) <= abs(e0) * math.exp(-1))
        out.append('tau measured (63.2%% point) = %.3f s   theory RC = %.3f s'
                   % (tt[k], model.tau))
        return out
    if model.kind == 'under':
        # extrema of e(t) are pi/wd apart; ratio of successive |extrema| = e^{-alpha pi/wd}
        idx = [i for i in range(1, len(e) - 1)
               if abs(e[i]) >= abs(e[i - 1]) and abs(e[i]) > abs(e[i + 1])
               and np.sign(e[i]) != 0 and abs(e[i]) > 0.05 * abs(e0)]
        # keep one extremum per half-cycle (largest between sign changes)
        ext, cur = [], None
        for i in idx:
            if cur is None or np.sign(e[i]) != np.sign(e[cur]):
                if cur is not None:
                    ext.append(cur)
                cur = i
            elif abs(e[i]) > abs(e[cur]):
                cur = i
        if cur is not None:
            ext.append(cur)
        if len(ext) >= 3:
            half = np.diff(tt[ext])
            wd = math.pi / half.mean()
            ratios = [abs(e[ext[j]]) / abs(e[ext[j + 1]]) for j in range(len(ext) - 1)]
            alpha = np.mean(np.log(ratios)) * wd / math.pi
            out.append('w_d measured = %.3f rad/s (period %.2f s)   theory %.3f rad/s'
                       % (wd, 2 * math.pi / wd, model.wd))
            out.append('alpha measured (log decrement) = %.3f 1/s   theory R/2L = %.3f 1/s'
                       % (alpha, model.alpha))
            out.append('-> R measured = 2*L*alpha = %.3f ohm, w0 measured = sqrt(alpha^2+w_d^2) = %.3f rad/s'
                       % (2 * model.L * alpha, math.sqrt(alpha ** 2 + wd ** 2)))
        else:
            out.append('not enough oscillations to measure alpha and w_d')
        return out
    # over / critical: compare 10-90% rise time
    def rise(tv, ee):
        p = 1 - ee / e0
        if not (p >= 0.9).any():
            return None
        return tv[np.argmax(p >= 0.9)] - tv[np.argmax(p >= 0.1)]
    tl = np.linspace(0, 60, 60001)
    r_th = rise(tl, model.step(tl, y0, yinf) - yinf)
    r_me = rise(tt, e)
    if r_me is None:
        out.append('output never reached 90%% before the input moved; hold still longer '
                   '(theory needs %.1f s)' % r_th)
    else:
        out.append('10-90%% rise time measured = %.3f s   theory = %.3f s' % (r_me, r_th))
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    path = sys.argv[1]
    meta, d = load(path)
    t, x, y = d['t'], d['theta_raw'], d['theta_filt']
    fs = 1 / np.median(np.diff(t))
    report = ['File: %s  (%d samples, %.1f s, ~%.0f Hz, sensor %s)'
              % (path, len(t), t[-1] - t[0], fs, meta.get('sensor', '?'))]
    if meta['mode'] == 'raw':
        print('This run used --mode raw; record with rc, conv or rlc to compare with theory.')
        sys.exit(0)
    model = Model(meta)
    report.append('Model: ' + model.label())

    fig, axs = plt.subplots(3, 1, figsize=(10, 11))
    # 1. y = x * h on real data
    yc = convolve_measured(t, x, model)
    rms = np.sqrt(np.mean((yc - y) ** 2))
    report.append('1) y = x*h check: RMS difference between Pi output and offline convolution = %.3f deg' % rms)
    ax = axs[0]
    ax.plot(t, x, color='0.7', lw=1, label='measured input x(t) (raw tilt)')
    ax.plot(t, y, lw=2, label='Pi output y(t)')
    ax.plot(t, yc, '--', lw=1.5, label='offline x(t) * h(t)')
    ax.set_title('Whole run: ' + model.label())
    ax.set_xlabel('t [s]')
    ax.set_ylabel('angle [deg]')
    ax.legend(loc='best', fontsize=8)
    ax.grid(alpha=0.3)

    # 2. step response
    ax = axs[1]
    st = find_step(t, x, fs)
    if st:
        ts, y0, yinf, k = st
        win = (t >= ts - 1) & (t <= ts + 6)
        ax.plot(t[win] - ts, x[win], color='0.7', lw=1, label='input')
        ax.plot(t[win] - ts, y[win], lw=2, label='Pi output')
        tt = np.linspace(0, 6, 600)
        ax.plot(tt, model.step(tt, y0, yinf), '--', lw=1.5, label='closed-form step response')
        ax.set_title('Step at t = %.2f s: %.1f -> %.1f deg' % (ts, y0, yinf))
        report.append('2) Step at t = %.2f s from %.1f to %.1f deg' % (ts, y0, yinf))
        for line in measure_params(t, x, y, ts, yinf, model, y0):
            report.append('   ' + line)
        after = k + int(2 * fs)
    else:
        ax.set_title('No clear step found (tilt quickly and hold still on both sides)')
        report.append('2) no clear step found')
        after = 0
    ax.set_xlabel('t - t_step [s]')
    ax.set_ylabel('angle [deg]')
    ax.legend(loc='best', fontsize=8)
    ax.grid(alpha=0.3)

    # 3. impulse (tap)
    ax = axs[2]
    tp = find_tap(t, x, fs, after=min(after, len(x) - 1))
    if tp:
        t1, area, base, k, k2 = tp
        # Superposition: response to the tap alone = y(with tap) - y(same input, tap removed)
        x_notap = x.copy()
        x_notap[k:k2 + 1] = base
        y_tap = y - convolve_measured(t, x_notap, model)
        win = (t >= t1 - 0.5) & (t <= t1 + 5)
        ax.plot(t[win] - t1, y_tap[win], lw=2, label='Pi output minus response without the tap')
        tt = np.linspace(0, 5, 500)
        ax.plot(tt, area * model.h(tt), '--', lw=1.5, label='A * h(t),  A = %.3f deg*s' % area)
        ax.set_title('Tap at t = %.2f s treated as an impulse of area A' % t1)
        fit = (t >= t1) & (t <= t1 + 5)
        err = np.sqrt(np.mean((y_tap[fit] - area * model.h(t[fit] - t1)) ** 2))
        peak = np.max(np.abs(area * model.h(tt)))
        report.append('3) Tap at t = %.2f s, pulse area A = %.3f deg*s; RMS(response - A*h) = %.3f deg '
                      '(peak of A*h = %.3f deg)' % (t1, area, err, peak))
    else:
        ax.set_title('No tap found (tap the board once, sharply, and hold still)')
        report.append('3) no tap found')
    ax.set_xlabel('t - t_tap [s]')
    ax.set_ylabel('angle [deg]')
    ax.legend(loc='best', fontsize=8)
    ax.grid(alpha=0.3)

    fig.tight_layout()
    png = path.rsplit('.', 1)[0] + '.png'
    fig.savefig(png, dpi=120)
    txt = path.rsplit('.', 1)[0] + '_report.txt'
    open(txt, 'w').write('\n'.join(report) + '\n')
    print('\n'.join(report))
    print('Saved', png, 'and', txt)


if __name__ == '__main__':
    main()
