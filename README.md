# Setup Raspberry Pi

1. Install the latest Raspberry Pi image to SD Card
1. Create a file in the boot partition called `ssh`
1. Update packages

   sudo apt-get update
   sudo apt-get upgrade
   sudo apt-get autoremove
   sudo reboot

1. Create a new user
   1. `sudo adduser epson`
   1. Add to sudo `sudo visudo` add the line `epson ALL=(ALL) NOPASSWD:ALL`
   1. Remove old user `sudo deluser pi`
   1. Enable password less ssh
      1. `mkdir .ssh`
      1. Copy contents of local `~/.ssh/id_rsa.pub` to pi `~/.ssh/authorized_keys`
      1. Fix permissions `chmod 700 .ssh; chmod 640 .ssh/authorized_keys`
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
