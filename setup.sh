#!/usr/bin/env bash

set -ex

git config core.editor "vim"
git config pull.rebase true

mkdir -p /home/node/.config/fish
cat <<EOF > /home/node/.config/fish/config.fish
set fish_greeting
set -gx FORCE_COLOR true
set -Ua fish_user_paths /home/node/.cargo/bin
EOF

cd core && yarn
