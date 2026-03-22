#!/usr/bin/env bash
# setup.sh — run once after cloning to activate the Git hooks.
# After this, every `git pull` will automatically deploy files to
# /home/gmnfnice/repositories/ar-digital-ad-studio

set -e

git config core.hooksPath .githooks
chmod +x .githooks/post-merge

echo "Git hooks activated. Future 'git pull' runs will deploy to /home/gmnfnice/repositories/ar-digital-ad-studio"
