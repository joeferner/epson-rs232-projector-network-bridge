#!/bin/bash
set -eou pipefail
DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "${DIR}/.."

function update {
  sudo apt -y update
  sudo apt -y upgrade
  sudo apt-get install -y libudev-dev minicom
  sudo apt-get autoremove
}

function dev_setup {
  echo "setup dev..."

  git config --global alias.co checkout
  git config --global alias.br branch
  git config --global alias.ci commit
  git config --global alias.st status

  if ! grep EDITOR ~/.bashrc; then
    echo "export EDITOR=/usr/bin/vi" >> ~/.bashrc
  fi
  if ! grep VISUAL ~/.bashrc; then
    echo "export VISUAL=/usr/bin/vi" >> ~/.bashrc
  fi

  sudo adduser "${USER}" spi || echo "already a user"

  echo "dev setup complete"
}

function rust_setup {
  echo "setup rust..."
  if [ ! -f ~/.cargo/bin/rustup ]; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  fi
  echo "rust setup complete"
}

function service_setup {
  echo "setup service..."
  sudo cp scripts/unisonht-epson-projector.service /etc/systemd/system/
  sudo systemctl enable unisonht-epson-projector.service
  sudo systemctl start unisonht-epson-projector.service
  echo "service setup complete"
}

update
dev_setup
rust_setup
service_setup
echo ""
echo "Setup complete"
echo ""
echo "You may need to reboot to finish setup"
