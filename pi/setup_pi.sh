#!/usr/bin/env bash
# setup_pi.sh - one-time setup that makes the Pi demo-proof: no university Wi-Fi needed.
#
#   cd ~/tiltlab && sudo bash pi/setup_pi.sh                  # random Wi-Fi password, printed at the end
#   sudo bash pi/setup_pi.sh --password 'my-pass-123'          # choose the password (8-63 chars)
#   sudo bash pi/setup_pi.sh --ssid TiltLab --hostname tiltlab --no-usb --no-service
#
# What it sets up (Raspberry Pi OS Bookworm or newer, which uses NetworkManager):
#   1. Wi-Fi access point "TiltLab" that starts at every boot. The Mac joins it and opens
#      http://10.42.0.1:8000. Works the same on campus, at home or with no network around.
#   2. Cable backup, and the Mac keeps its own internet:
#      - Ethernet (Pi 3B and any Pi with a port): cable to the Mac's USB-C Ethernet adapter
#        gives http://10.56.0.1:8000. Plugged into a router instead, eth0 uses DHCP as usual.
#      - USB (Pi 4 / Pi 5 / Zero / Zero 2 W only): one USB-C cable from the Mac powers the Pi
#        and gives http://10.55.0.1:8000.
#   3. A systemd service that starts "tiltlab.py --zero --dashboard" at boot.
#   4. Hostname "tiltlab", so http://tiltlab.local:8000 also works.
#
# Run it while the Pi still has internet (home Wi-Fi or Ethernet). Nothing changes until you
# reboot, so an SSH session over Wi-Fi is not cut in the middle. After the reboot the Pi's Wi-Fi
# is the TiltLab access point; "bash pi/tiltlab-net.sh home" switches back until the next boot.
set -euo pipefail

SSID="TiltLab"
PASSWORD=""
HOSTNAME_NEW="tiltlab"
DO_USB=1
DO_SERVICE=1
AP_IP="10.42.0.1"
USB_IP="10.55.0.1"
ETH_IP="10.56.0.1"
COUNTRY_DEFAULT="IL"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ssid) SSID="$2"; shift 2 ;;
        --password) PASSWORD="$2"; shift 2 ;;
        --hostname) HOSTNAME_NEW="$2"; shift 2 ;;
        --no-usb) DO_USB=0; shift ;;
        --no-service) DO_SERVICE=0; shift ;;
        -h|--help) sed -n '2,21p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1 (try --help)"; exit 1 ;;
    esac
done

die() { echo "ERROR: $*" >&2; exit 1; }
step() { echo; echo "== $*"; }

[[ $EUID -eq 0 ]] || die "run with sudo:  sudo bash pi/setup_pi.sh"
RUN_USER="${SUDO_USER:-pi}"
[[ "$RUN_USER" != "root" ]] || die "run it as your normal user with sudo, not from a root shell"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -f "$REPO_DIR/tiltlab.py" ]] || die "tiltlab.py not found next to pi/ (looked in $REPO_DIR)"

systemctl is-active --quiet NetworkManager \
    || die "NetworkManager is not running. This needs Raspberry Pi OS Bookworm or newer."
command -v nmcli >/dev/null || die "nmcli not found"

if [[ -z "$PASSWORD" ]]; then
    # no 0/O or 1/l to misread; "|| true" because head closing the pipe makes tr exit non-zero
    PASSWORD="$(LC_ALL=C tr -dc 'a-km-z2-9' </dev/urandom | head -c 10 || true)"
fi
(( ${#PASSWORD} >= 8 && ${#PASSWORD} <= 63 )) || die "Wi-Fi password must be 8-63 characters"

MODEL="$(tr -d '\0' </proc/device-tree/model 2>/dev/null || echo unknown)"
echo "Pi model: $MODEL"
echo "Repo:     $REPO_DIR (service runs as $RUN_USER)"

# ---------------------------------------------------------------- prerequisites
step "Checking prerequisites"
if ! command -v dnsmasq >/dev/null; then
    echo "Installing dnsmasq-base (gives the Mac an address on the Pi's network)..."
    apt-get install -y dnsmasq-base || die "could not install dnsmasq-base; is the Pi online?"
fi
COUNTRY="$(raspi-config nonint get_wifi_country 2>/dev/null || true)"
if [[ -z "$COUNTRY" ]]; then
    echo "Wi-Fi country not set; setting it to $COUNTRY_DEFAULT (needed before the Pi may transmit)"
    raspi-config nonint do_wifi_country "$COUNTRY_DEFAULT"
fi
rfkill unblock wifi 2>/dev/null || true

# ---------------------------------------------------------------- 1. Wi-Fi access point
step "1. Wi-Fi access point \"$SSID\" -> http://$AP_IP:8000"
nmcli connection delete TiltLab-AP >/dev/null 2>&1 || true
nmcli connection add type wifi ifname wlan0 con-name TiltLab-AP ssid "$SSID" \
    connection.autoconnect yes connection.autoconnect-priority 100 \
    802-11-wireless.mode ap 802-11-wireless.band bg 802-11-wireless.channel 6 \
    802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk "$PASSWORD" \
    802-11-wireless-security.proto rsn 802-11-wireless-security.pairwise ccmp \
    802-11-wireless-security.group ccmp \
    ipv4.method shared ipv4.addresses "$AP_IP/24" ipv6.method disabled >/dev/null
echo "Created (starts at the next boot, and wins over saved home Wi-Fi)."

# ---------------------------------------------------------------- 2. USB-cable network
step "2. USB-cable network -> http://$USB_IP:8000"
if [[ $DO_USB -eq 0 ]]; then
    echo "Skipped (--no-usb)."
elif [[ "$MODEL" =~ Raspberry\ Pi\ (4|5|Zero) ]]; then
    BOOT=/boot/firmware
    [[ -f $BOOT/config.txt ]] || BOOT=/boot
    CFG=$BOOT/config.txt
    CMD=$BOOT/cmdline.txt
    cp -n "$CFG" "$CFG.tiltlab-backup" || true
    cp -n "$CMD" "$CMD.tiltlab-backup" || true
    # look for our exact line: stock config.txt already has "dtoverlay=dwc2,dr_mode=host" under [cm5]
    if ! grep -q '^dtoverlay=dwc2,dr_mode=peripheral' "$CFG"; then
        printf '\n[all]\n# TiltLab: USB-C port acts as a network adapter for the Mac\ndtoverlay=dwc2,dr_mode=peripheral\n' >>"$CFG"
    fi
    if ! grep -q 'modules-load=dwc2,g_ether' "$CMD"; then
        # fixed MAC addresses, so macOS sees the same adapter every boot
        sed -i '1 s/$/ modules-load=dwc2,g_ether g_ether.dev_addr=02:7e:11:7a:b0:01 g_ether.host_addr=02:7e:11:7a:b0:02/' "$CMD"
    fi
    nmcli connection delete TiltLab-USB >/dev/null 2>&1 || true
    nmcli connection add type ethernet ifname usb0 con-name TiltLab-USB \
        connection.autoconnect yes ipv4.method shared ipv4.addresses "$USB_IP/24" \
        ipv6.method link-local >/dev/null
    echo "Enabled. Backups: $CFG.tiltlab-backup, $CMD.tiltlab-backup"
    if [[ "$MODEL" =~ Raspberry\ Pi\ 5 ]]; then
        echo "Note: a Pi 5 wants more current than a Mac USB-C port gives. If it reboots or warns"
        echo "      about power, use the Wi-Fi access point instead."
    fi
else
    echo "Not available on this model (needs Pi 4, Pi 5 or a Zero); the Ethernet cable below is the backup."
fi

# ---------------------------------------------------------------- 2b. direct Ethernet cable
# Plugged into a router, eth0 gets an address by DHCP as usual. Plugged straight into the Mac
# (USB-C Ethernet adapter), DHCP gets no answer within 15 s, so NetworkManager falls back to the
# second profile: the Pi becomes 10.56.0.1 and hands the Mac an address itself.
step "2b. Direct Ethernet cable -> http://$ETH_IP:8000"
if ip link show eth0 >/dev/null 2>&1; then
    # stop older wired profiles from competing at boot (a profile in use stays up until then)
    while IFS=: read -r name type; do
        if [[ "$type" == "802-3-ethernet" && "$name" != TiltLab-* ]]; then
            nmcli connection modify "$name" connection.autoconnect no && echo "Autoconnect off: $name"
        fi
    done < <(nmcli -t -f NAME,TYPE connection show)
    nmcli connection delete TiltLab-ETH-DHCP >/dev/null 2>&1 || true
    nmcli connection delete TiltLab-ETH-Direct >/dev/null 2>&1 || true
    nmcli connection add type ethernet ifname eth0 con-name TiltLab-ETH-DHCP \
        connection.autoconnect yes connection.autoconnect-priority 10 \
        ipv4.method auto ipv4.dhcp-timeout 15 ipv4.may-fail no ipv6.method disabled >/dev/null
    nmcli connection add type ethernet ifname eth0 con-name TiltLab-ETH-Direct \
        connection.autoconnect yes connection.autoconnect-priority 0 \
        ipv4.method shared ipv4.addresses "$ETH_IP/24" ipv6.method disabled >/dev/null
    echo "Enabled. Cable to a router: normal DHCP. Cable to the Mac: $ETH_IP after ~20 s."
else
    echo "No eth0 on this model; skipped."
fi

# ---------------------------------------------------------------- 3. autostart service
step "3. Dashboard starts at boot"
if [[ $DO_SERVICE -eq 0 ]]; then
    echo "Skipped (--no-service)."
else
    sed -e "s|@USER@|$RUN_USER|g" -e "s|@DIR@|$REPO_DIR|g" \
        "$REPO_DIR/pi/tiltlab.service" >/etc/systemd/system/tiltlab.service
    systemctl daemon-reload
    systemctl enable tiltlab.service >/dev/null
    echo "Enabled tiltlab.service (logs: journalctl -u tiltlab -f)."
    echo "Edit /etc/systemd/system/tiltlab.service to change the start-up mode, then reboot."
fi

# ---------------------------------------------------------------- 4. hostname
step "4. Hostname -> $HOSTNAME_NEW.local"
OLD_HOST="$(hostname)"
if [[ "$OLD_HOST" != "$HOSTNAME_NEW" ]]; then
    hostnamectl set-hostname "$HOSTNAME_NEW"
    sed -i "s/^127\.0\.1\.1.*/127.0.1.1\t$HOSTNAME_NEW/" /etc/hosts
    echo "Renamed $OLD_HOST -> $HOSTNAME_NEW"
else
    echo "Already $HOSTNAME_NEW"
fi

# ---------------------------------------------------------------- summary
cat <<EOF

=====================================================================
 Done. Reboot to switch to demo mode:   sudo reboot

 On the Mac (about 30 s after the Pi powers up):
   Wi-Fi:  join "$SSID", password:  $PASSWORD
           then open  http://$AP_IP:8000
   Ethernet cable to the Mac (USB-C Ethernet adapter), wait ~20 s:
           http://$ETH_IP:8000
   USB-C cable to the Pi's power port (Pi 4/5/Zero only):
           http://$USB_IP:8000
   Either: http://$HOSTNAME_NEW.local:8000

 Write the password down. To see it again on the Pi:
   sudo nmcli -s -g 802-11-wireless-security.psk connection show TiltLab-AP
 Back to home Wi-Fi until the next boot:   bash pi/tiltlab-net.sh home
=====================================================================
EOF
