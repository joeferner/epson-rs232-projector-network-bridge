# Supports

- Epson 5030UB 2D/3D 1080p 3LCD Projector

# Mock serial port

```
terminal1> socat -d -d pty,raw,echo=0 pty,raw,echo=0
terminal2> LOG_LEVEL=debug TIMEOUT=30 SERIAL_PORT=/dev/pts/3 cargo run
terminal3> cat < /dev/pts/2
terminal3> printf "PWR=00\r\n" > /dev/pts/2
```

# Setup Raspberry Pi

1. Install rpi-imager locally
1. Edit Settings
   - hostname: epson
   - set username/password
   - (optional) configure wireless lan
   - set locale settings
   - enable ssh
1. Start the Raspberry Pi, open a command prompt and `ping epson.local`
1. Open a terminal

        ssh <username>@epson.local
        sudo apt update
        sudo apt -y install git
        # copy id_rsa from host computer
        chmod 600 ~/.ssh/id_rsa
        ssh-keygen -p -f ~/.ssh/id_rsa # remove password
        git clone git@github.com:joeferner/unisonht-epson-network-rs232-projector.git
        ./unisonht-epson-network-rs232-projector/scripts/raspberry-pi-setup.sh

1. Install "Remote Development" extension pack for VSCode.
1. Connect VSCode via ssh (Ctrl+Shift+P -> Remote-SSH: Connect to Host...) `<username>@epson.local`
1. Run `LOG_LEVEL=debug cargo run`


1. Fix the time

   sudo apt-get install ntpdate
   sudo /etc/init.d/ntp stop
   sudo ntpd -q -g
   sudo /etc/init.d/ntp start

1. Reboot nightly
   1. `sudo vi /etc/crontab`
   1. Add `0 5 * * * root reboot`
1. Install node
   1. `uname -m`
   1. `sudo apt-get install xz-utils`
   1. `wget https://nodejs.org/dist/v10.16.2/node-v10.16.2-linux-armv7l.tar.xz`
   1. `xz -d node-v10.16.2-linux-armv7l.tar.xz`
   1. `tar xf node-v10.16.2-linux-armv7l.tar`
   1. `cd node-v10.16.2-linux-armv7l`
   1. `sudo cp -R bin/ include/ lib/ share/ /usr/local/`
   1. `cd ..`
   1. `rm -rf node-v10.16.2-linux-armv7l`
   1. `sudo npm install -g npm`
1. Install node-pi-rs232
   1. `sudo su -` (npm install requires being root and not just sudo)
   1. `apt-get install git`
   1. `cd /opt`
   1. `git clone https://github.com/joeferner/node-pi-rs232.git`
   1. `cd /opt/node-pi-rs232`
   1. `npm install`
   1. Autostart, add `/opt/node-pi-rs232/run.sh > /dev/null 2>&1 &` to `/etc/rc.local`
1. Change pi to readonly mode (see https://github.com/adafruit/Raspberry-Pi-Installer-Scripts/blob/master/read-only-fs.sh)
   1. `scp read-only-fs.sh 192.168.0.161:`
   1. `sudo bash read-only-fs.sh`
   1. Enable boot-time read/write jumper? `y`
   1. GPIO pin for R/W jumper: `21`
   1. Install GPIO-halt utility? `n`
   1. Enable kernel panic watchdog? `y`
