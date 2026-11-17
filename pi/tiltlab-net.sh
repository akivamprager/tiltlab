#!/usr/bin/env bash
# tiltlab-net.sh - switch the Pi's Wi-Fi between demo mode and your normal Wi-Fi.
#
#   bash pi/tiltlab-net.sh status   # what is connected, and the dashboard addresses
#   bash pi/tiltlab-net.sh ap       # demo mode: broadcast the TiltLab network (also the default at boot)
#   bash pi/tiltlab-net.sh home     # join the saved home Wi-Fi / phone hotspot (for apt, git pull)
#
# Switching drops an SSH session that runs over Wi-Fi. The USB-cable link is not affected.
# "home" lasts until the next reboot; at boot the TiltLab access point always comes back.
set -euo pipefail

cmd="${1:-status}"
case "$cmd" in
    status)
        nmcli -t -f NAME,DEVICE connection show --active | sed 's/:/  on  /'
        echo
        echo "Dashboard addresses:"
        for ip in $(hostname -I); do
            case "$ip" in
                10.42.0.1) echo "  http://$ip:8000   (TiltLab Wi-Fi)" ;;
                10.55.0.1) echo "  http://$ip:8000   (USB cable)" ;;
                10.56.0.1) echo "  http://$ip:8000   (Ethernet cable to the Mac)" ;;
                *:*) ;;
                *) echo "  http://$ip:8000" ;;
            esac
        done
        echo "  http://$(hostname).local:8000"
        systemctl is-active --quiet tiltlab && echo "tiltlab.service: running" || echo "tiltlab.service: not running"
        ;;
    ap)
        sudo nmcli connection up TiltLab-AP
        ;;
    home)
        # the first saved Wi-Fi client connection (Raspberry Pi Imager names it "preconfigured")
        name="$(nmcli -t -f NAME,TYPE connection show | awk -F: '$2=="802-11-wireless" && $1!="TiltLab-AP" {print $1; exit}')"
        [[ -n "$name" ]] || { echo "No saved Wi-Fi found. Add one: sudo nmcli device wifi connect <SSID> password <pass>"; exit 1; }
        echo "Joining \"$name\"..."
        sudo nmcli connection up "$name"
        ;;
    *)
        echo "usage: bash pi/tiltlab-net.sh status|ap|home"; exit 1 ;;
esac
