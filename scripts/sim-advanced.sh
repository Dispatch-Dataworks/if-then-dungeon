#!/usr/bin/env bash
# Runs each advanced hero on the levels after it unlocks (one process per level, in parallel).
# Usage: scripts/sim-advanced.sh [seeds]   (ONLY=H_A,H_B limits the heroes; UPGRADES=max grants earned upgrades)
set -euo pipefail
seeds=${1:-8}
cd "$(dirname "$0")/.."
for l in $(seq 2 24); do
  heroes=$(ONLY="${ONLY:-}" node -e "const only=process.env.ONLY?process.env.ONLY.split(','):null;const h=require('./heroes.json').heroes.filter(h=>h.tier==='advanced'&&h.unlockAfterLevel<$l&&(!only||only.includes(h.id))).map(h=>h.id);console.log(h.join(','))")
  [ -n "$heroes" ] && echo "$l $heroes"
done | xargs -P "$(nproc)" -L1 sh -c 'npx vite-node src/sim/cli.ts "$0" "$1" '"$seeds" | grep -v '^level' | sort -n -k1,1 -s
