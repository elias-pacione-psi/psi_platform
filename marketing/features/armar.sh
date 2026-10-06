#!/usr/bin/env bash
# Ensambla frames en el MP4 de salida (solo imagen, sin audio).
#   ./armar.sh frames-supervisiones out/supervisiones-16x9.mp4
#   ./armar.sh frames9-terapia-individual out/terapia-individual-9x16.mp4
set -euo pipefail
FRAMES="${1:?primer argumento: carpeta de frames}"
SALIDA="${2:?segundo argumento: mp4 de salida}"
ffmpeg -y -framerate 30 -i "$FRAMES/f_%06d.png" \
  -c:v libx264 -pix_fmt yuv420p -crf 19 -preset medium -movflags +faststart \
  "$SALIDA"
echo "listo: $SALIDA"
