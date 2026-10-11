#!/usr/bin/env bash
# Runs the balance sim for every level in parallel (one process per level) and prints a sorted table
# followed by a per-level summary. Usage: scripts/sim-all.sh [starter|all|H_A,H_B] [seeds] [first-last]
set -euo pipefail
heroes=${1:-starter}; seeds=${2:-6}; range=${3:-1-24}
first=${range%-*}; last=${range#*-}
cd "$(dirname "$0")/.."
seq "$first" "$last" | xargs -P "$(nproc)" -I{} npx vite-node src/sim/cli.ts {} "$heroes" "$seeds" \
  | grep -v '^level' | sort -n -k1,1 -s | awk '
  { print; split($3,a,"/"); split($4,b,"/"); f[$1]+=a[1]; c[$1]+=b[1]; n[$1]+=a[2]; t[$1]+=$5*b[1]; d[$1]+=$6*a[2]; e[$1]+=$8*a[2] }
  END {
    print "\nlevel  1stTry  cleared  turns  deaths/run  maxEnemies"
    for (l = 1; l <= 99; l++) if (n[l]) printf "L%-4d %6.0f%% %7.0f%% %6.1f %11.1f %11.1f\n", l, f[l]/n[l]*100, c[l]/n[l]*100, (c[l] ? t[l]/c[l] : 0), d[l]/n[l], e[l]/n[l]
  }'
