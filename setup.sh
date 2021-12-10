#!/usr/bin/env bash

set -ex

mkdir -p /home/node/.config/fish
cat <<EOF > /home/node/.config/fish/config.fish
set fish_greeting
EOF

yarn
