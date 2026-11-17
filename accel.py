"""
accel.py - finds an I2C accelerometer on the Pi and reads (ax, ay, az) in g.

Supported (auto-detected by their ID register):
  MPU6050 / MPU6500 / MPU9250 / GY-521   addr 0x68 or 0x69
  ADXL345 / GY-291                       addr 0x53 or 0x1D
  LIS3DH                                 addr 0x18 or 0x19
  MMA8452Q                               addr 0x1C or 0x1D

Analog accelerometers (ADXL335, GY-61) can't be read directly: the Pi has no ADC.
"""
import math
import random
import time

try:
    from smbus2 import SMBus
except ImportError:            # Raspberry Pi OS ships python3-smbus
    try:
        from smbus import SMBus
    except ImportError:
        SMBus = None


def _s16(hi, lo):
    v = (hi << 8) | lo
    return v - 65536 if v & 0x8000 else v


class MPU6050:
    name = 'MPU6050-family'

    def __init__(self, bus, addr):
        self.bus, self.addr = bus, addr
        bus.write_byte_data(addr, 0x6B, 0x00)   # PWR_MGMT_1: wake up
        bus.write_byte_data(addr, 0x1C, 0x00)   # ACCEL_CONFIG: +-2 g -> 16384 LSB/g
        time.sleep(0.05)

    def read(self):
        d = self.bus.read_i2c_block_data(self.addr, 0x3B, 6)
        return tuple(_s16(d[2 * k], d[2 * k + 1]) / 16384.0 for k in range(3))


class ADXL345:
    name = 'ADXL345'

    def __init__(self, bus, addr):
        self.bus, self.addr = bus, addr
        bus.write_byte_data(addr, 0x2C, 0x0A)   # BW_RATE: 100 Hz output rate
        bus.write_byte_data(addr, 0x31, 0x08)   # DATA_FORMAT: full resolution, +-2 g
        bus.write_byte_data(addr, 0x2D, 0x08)   # POWER_CTL: measure
        time.sleep(0.05)

    def read(self):
        d = self.bus.read_i2c_block_data(self.addr, 0x32, 6)
        return tuple(_s16(d[2 * k + 1], d[2 * k]) * 0.0039 for k in range(3))  # 3.9 mg/LSB


class LIS3DH:
    name = 'LIS3DH'

    def __init__(self, bus, addr):
        self.bus, self.addr = bus, addr
        bus.write_byte_data(addr, 0x20, 0x57)   # CTRL_REG1: 100 Hz, x/y/z on
        bus.write_byte_data(addr, 0x23, 0x08)   # CTRL_REG4: high resolution, +-2 g
        time.sleep(0.05)

    def read(self):
        d = self.bus.read_i2c_block_data(self.addr, 0x28 | 0x80, 6)  # 0x80 = auto-increment
        return tuple((_s16(d[2 * k + 1], d[2 * k]) >> 4) / 1000.0 for k in range(3))  # 1 mg/LSB


class MMA8452:
    name = 'MMA8452Q'

    def __init__(self, bus, addr):
        self.bus, self.addr = bus, addr
        bus.write_byte_data(addr, 0x2A, 0x00)   # CTRL_REG1: standby
        bus.write_byte_data(addr, 0x0E, 0x00)   # XYZ_DATA_CFG: +-2 g
        bus.write_byte_data(addr, 0x2A, 0x19)   # 100 Hz, active
        time.sleep(0.05)

    def read(self):
        d = self.bus.read_i2c_block_data(self.addr, 0x01, 6)
        return tuple((_s16(d[2 * k], d[2 * k + 1]) >> 4) / 1024.0 for k in range(3))


# (address, ID register, accepted ID values, driver)
_PROBES = [
    (0x68, 0x75, {0x68, 0x70, 0x71, 0x72, 0x73, 0x98}, MPU6050),
    (0x69, 0x75, {0x68, 0x70, 0x71, 0x72, 0x73, 0x98}, MPU6050),
    (0x53, 0x00, {0xE5}, ADXL345),
    (0x1D, 0x00, {0xE5}, ADXL345),
    (0x18, 0x0F, {0x33}, LIS3DH),
    (0x19, 0x0F, {0x33}, LIS3DH),
    (0x1C, 0x0D, {0x2A}, MMA8452),
    (0x1D, 0x0D, {0x2A}, MMA8452),
]


def detect(busnum=1):
    if SMBus is None:
        raise RuntimeError('No smbus library. Run:  sudo apt install python3-smbus')
    try:
        bus = SMBus(busnum)
    except (FileNotFoundError, PermissionError) as e:
        raise RuntimeError('Cannot open I2C bus %d (%s). Enable I2C: sudo raspi-config -> '
                           'Interface Options -> I2C, then reboot.' % (busnum, e))
    seen = []
    for addr, reg, ids, cls in _PROBES:
        try:
            who = bus.read_byte_data(addr, reg)
        except OSError:
            continue
        seen.append('0x%02X(reg 0x%02X = 0x%02X)' % (addr, reg, who))
        if who in ids:
            return cls(bus, addr), addr
    raise RuntimeError('No supported accelerometer found. Responding: %s. Check wiring and run '
                       '"i2cdetect -y 1".' % (', '.join(seen) or 'nothing'))


class FakeAccel:
    """Scripted motion for --sim (22 s loop): flat, step to +20 deg at 2 s, back to 0 at 9 s,
    a 30 ms tap at 13 s, then a slow sway."""
    name = 'simulated'

    def __init__(self, noise_deg=0.4, manual=False):
        self.t0 = time.monotonic()
        self.noise = noise_deg
        self.manual = manual        # True: the dashboard sets the angle and taps
        self.target = 0.0
        self.tap_until = 0.0

    def tap(self):
        self.tap_until = time.monotonic() + 0.03

    def angle_at(self, t):
        if self.manual:
            th = self.target + (25.0 if time.monotonic() < self.tap_until else 0.0)
            return th + random.gauss(0, self.noise)
        t = t % 22
        if t < 2:
            th = 0.0
        elif t < 9:
            th = 20.0                     # step up
        elif t < 13:
            th = 0.0                      # step down
        elif t < 13.03:
            th = 25.0                     # tap: ~30 ms pulse, area ~0.75 deg*s
        elif t < 17:
            th = 0.0
        else:
            th = 15 * math.sin(2 * math.pi * 0.4 * (t - 17))  # slow sway
        return th + random.gauss(0, self.noise)

    def read(self):
        th = math.radians(self.angle_at(time.monotonic() - self.t0))
        return (0.0, math.sin(th), math.cos(th))   # roll about x axis
