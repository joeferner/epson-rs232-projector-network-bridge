#!/bin/bash
set -eou pipefail
DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "${DIR}/.."

function update {
  sudo apt -y update
  sudo apt -y upgrade
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

function readonlyfs_setup {
  echo "setup read only fs..."
  sudo raspi-config nonint enable_overlayfs
  echo "read only fs setup complete..."
}

update
dev_setup
rust_setup
readonlyfs_setup
echo ""
echo "Setup complete"
echo ""
echo "You may need to reboot to finish setup"
echo ""
echo "To disable readonly filesystem run: sudo raspi-config nonint disable_overlayfs"
echo ""
