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

# Raspberry Pi development

1. Install "Remote Development" extension pack for VSCode.
1. Connect VSCode via ssh (Ctrl+Shift+P -> Remote-SSH: Connect to Host...) `<username>@epson.local`
1. Stop service `sudo systemctl stop unisonht-epson-projector`
1. Run `RUST_BACKTRACE=1 LOG_LEVEL=debug cargo run`
