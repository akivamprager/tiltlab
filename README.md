# Tilt Lab

An LED spirit level whose bubble moves through a virtual RC or RLC circuit, with a live
dashboard you open in a laptop browser. Built for the Intro to Electrical Engineering course
(tirgulim 1–6). The full build guide covers wiring, the math and the experiments.

## Files

| File | Runs on | What it does |
| --- | --- | --- |
| `tiltlab.py` | Pi (or laptop with `--sim`) | Reads the accelerometer, runs the virtual circuit, drives the LEDs, serves the dashboard |
| `dashboard.html` / `dashboard_server.py` | served by `tiltlab.py` | The live dashboard (no installs on the laptop) |
| `accel.py` | Pi | Auto-detects MPU6050 / ADXL345 / LIS3DH / MMA8452 over I2C |
| `filters.py` | Pi | RC, RC-as-convolution and series-RLC "virtual circuits" |
| `predict.py` | anywhere (numpy) | LED resistor, load line, small-signal and R-2R DAC numbers |
| `analyze.py` | anywhere (numpy, matplotlib) | Plots a logged CSV against theory |
| `dac_test.py` | Pi | Steps the optional R-2R DAC through codes 0–7 |

## Quick start on the Pi

```bash
sudo raspi-config nonint do_i2c 0      # enable I2C (or: raspi-config > Interface Options > I2C), then reboot
sudo apt install -y python3-smbus i2c-tools
i2cdetect -y 1                         # the sensor should show up (68, 53, 18 or 1c)
cd ~/tiltlab
python3 tiltlab.py --zero --dashboard  # then open http://<pi-name>.local:8000 on the laptop
```

## Rehearse on the Mac without hardware

```bash
python3 tiltlab.py --sim --dashboard   # open http://localhost:8000
```

## Command-line modes (without the dashboard)

```bash
python3 tiltlab.py --mode rc  --R 1 --C 0.3              # tau = 0.3 s
python3 tiltlab.py --mode rlc --R 1 --L 1 --C 0.1        # underdamped
python3 tiltlab.py --mode rlc --R 1 --L 1 --C 0.1 --log run.csv
python3 analyze.py run.csv                               # run.png + run_report.txt
```
