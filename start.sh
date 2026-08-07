#!/bin/bash
set -e

apt-get update -qq && apt-get install -y -qq curl git unzip

curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Hapus dulu kalau sudah ada
rm -rf /app/qwen-gate
git clone https://github.com/youssefvdel/qwen-gate.git /app/qwen-gate
cd /app/qwen-gate

bun install

RAILWAY_PORT="${PORT:-8080}"
bun -e "
const fs = require('fs');
let raw = fs.readFileSync('config.json', 'utf8');
raw = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const cfg = JSON.parse(raw);
cfg.HOST = '0.0.0.0';
cfg.PORT = '$RAILWAY_PORT';
fs.writeFileSync('config.json', JSON.stringify(cfg, null, 2));
console.log('Patched HOST:', cfg.HOST, 'PORT:', cfg.PORT);
"

bun start
