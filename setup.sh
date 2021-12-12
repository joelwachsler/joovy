#!/usr/bin/env bash

set -ex

git config core.editor "vim"

mkdir -p /home/node/.config/fish
cat <<EOF > /home/node/.config/fish/config.fish
set fish_greeting
EOF

yarn
