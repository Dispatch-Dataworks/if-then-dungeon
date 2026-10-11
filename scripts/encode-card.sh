#!/usr/bin/env bash
# Turn a raw 16:9 Flow clip into card art: assets/art/<ID>/card.mp4 (seamless 5:4 loop, 640x512, H.264, no audio)
# plus card.webp (first frame, used as poster and still).
#
#   scripts/encode-card.sh raw.mp4 H_SWORDSMAN [x-shift]
#
# The loop crossfades the clip's last FADE seconds into its start, so the cut is invisible.
# x-shift moves the 5:4 crop window right (+) or left (-) in source pixels when the subject is off-centre.
set -euo pipefail
src=$1 id=$2 shift_x=${3:-0}
FADE=0.5 CRF=24
out=assets/art/$id
mkdir -p "$out"

probe() { ffprobe -v error -select_streams v:0 -show_entries "$1" -of default=nw=1:nk=1 "$src"; }
w=$(probe stream=width) h=$(probe stream=height) dur=$(probe stream=duration)
cw=$(( h * 5 / 4 / 2 * 2 ))
cx=$(( (w - cw) / 2 + shift_x ))
crop="crop=$cw:$h:$cx:0,scale=640:512:flags=lanczos,fps=24"
body=$(echo "$dur - $FADE" | bc -l)
offset=$(echo "$body - $FADE" | bc -l)

ffmpeg -v error -y -i "$src" -i "$src" -filter_complex \
  "[0:v]trim=$FADE:$dur,setpts=PTS-STARTPTS,$crop[a];[1:v]trim=0:$FADE,setpts=PTS-STARTPTS,$crop[b];[a][b]xfade=transition=fade:duration=$FADE:offset=$offset,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -profile:v main -crf $CRF -preset slow -movflags +faststart "$out/card.mp4"
ffmpeg -v error -y -i "$out/card.mp4" -frames:v 1 -c:v libwebp -quality 82 "$out/card.webp"

size=$(stat -c%s "$out/card.mp4")
echo "$out/card.mp4: $((size / 1024)) KB$([ "$size" -gt 512000 ] && echo '  (over the 500 KB budget: raise CRF)')"
grep -q "\"$id\"" assets/art/faces.json || echo "Add a face crop for $id to assets/art/faces.json"
