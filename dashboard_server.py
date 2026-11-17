"""
dashboard_server.py - tiny web server (Python standard library only) that the Pi runs
so a laptop browser can show live graphs and change the virtual circuit.

  GET  /          dashboard.html
  GET  /stream    Server-Sent Events: new samples + current settings, ~20 times a second
  GET  /state     current settings as JSON
  POST /params    {"mode": "rlc", "R": 1, "L": 1, "C": 0.1}  -> rebuilds the filter
  POST /sim       {"angle": 20} or {"tap": true}             -> drives the simulated sensor
"""
import itertools
import json
import os
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))


class Shared:
    """State shared between the 100 Hz control loop and the web threads."""

    def __init__(self, params, info):
        self.lock = threading.Lock()
        self.params = dict(params)       # mode, R, L, C
        self.info = dict(info)           # sensor, rate, leds, range, sim, ...
        self.version = 0                 # bumps when params change
        self.pending = None              # params waiting for the loop to apply
        self.samples = deque(maxlen=20000)   # (index, t, raw, filt, dac)
        self.count = 0
        self.sim = None                  # FakeAccel when --sim

    def push(self, t, raw, filt, dac):
        with self.lock:
            self.samples.append((self.count, t, raw, filt, dac))
            self.count += 1

    def since(self, idx):
        with self.lock:
            if not self.samples:
                return [], idx
            first = self.samples[0][0]
            start = max(idx, first) - first
            out = [s[1:] for s in itertools.islice(self.samples, start, None)]
            return out, self.count

    def request_params(self, p):
        with self.lock:
            self.pending = p

    def take_pending(self):
        with self.lock:
            p, self.pending = self.pending, None
            return p

    def set_params(self, p):
        with self.lock:
            self.params = dict(p)
            self.version += 1

    def snapshot(self):
        with self.lock:
            return {'params': dict(self.params), 'version': self.version, 'info': dict(self.info)}


def _num(v, lo, hi, default):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return default
    return min(hi, max(lo, v))


def make_handler(shared):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):          # keep the terminal quiet
            pass

        def _json(self, obj, code=200):
            body = json.dumps(obj).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path in ('/', '/index.html'):
                with open(os.path.join(HERE, 'dashboard.html'), 'rb') as f:
                    body = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            elif self.path == '/state':
                self._json(shared.snapshot())
            elif self.path == '/stream':
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                # start with the last 10 s so a fresh page has something to draw
                rate = shared.info.get('rate', 100)
                idx = max(0, shared.count - int(10 * rate))
                try:
                    while True:
                        data, idx = shared.since(idx)
                        snap = shared.snapshot()
                        msg = {'s': [[round(t, 4), round(r, 3), round(f, 3), d] for t, r, f, d in data],
                               'p': snap['params'], 'v': snap['version']}
                        self.wfile.write(b'data: ' + json.dumps(msg).encode() + b'\n\n')
                        self.wfile.flush()
                        time.sleep(0.05)
                except (BrokenPipeError, ConnectionResetError, OSError):
                    return
            else:
                self.send_error(404)

        def do_POST(self):
            n = int(self.headers.get('Content-Length', 0) or 0)
            try:
                body = json.loads(self.rfile.read(n) or b'{}')
            except ValueError:
                return self._json({'error': 'bad json'}, 400)
            if self.path == '/params':
                cur = shared.snapshot()['params']
                p = {
                    'mode': body.get('mode', cur['mode']) if body.get('mode') in ('raw', 'rc', 'conv', 'rlc') else cur['mode'],
                    'R': _num(body.get('R', cur['R']), 0.0, 1000.0, cur['R']),
                    'L': _num(body.get('L', cur['L']), 0.01, 100.0, cur['L']),
                    'C': _num(body.get('C', cur['C']), 0.001, 100.0, cur['C']),
                }
                if p['mode'] in ('rc', 'conv') and p['R'] * p['C'] < 0.02:
                    p['R'] = 0.02 / p['C']          # keep tau >= 20 ms (2 samples)
                shared.request_params(p)
                return self._json({'ok': True, 'params': p})
            if self.path == '/sim':
                if shared.sim is None:
                    return self._json({'error': 'not in --sim mode'}, 400)
                if 'angle' in body:
                    shared.sim.target = _num(body['angle'], -90, 90, 0)
                if body.get('tap'):
                    shared.sim.tap()
                return self._json({'ok': True})
            self.send_error(404)

    return Handler


def start(shared, port):
    srv = ThreadingHTTPServer(('0.0.0.0', port), make_handler(shared))
    srv.daemon_threads = True
    th = threading.Thread(target=srv.serve_forever, daemon=True)
    th.start()
    return srv
