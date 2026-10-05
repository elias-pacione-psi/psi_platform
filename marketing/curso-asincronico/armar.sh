#!/usr/bin/env bash
# Ensambla frames + audio-final.wav en el MP4 de salida.
#   ./armar.sh frames  out/curso-asincronico-16x9.mp4
#   ./armar.sh frames9 out/curso-asincronico-9x16.mp4
set -euo pipefail
FRAMES="${1:?primer argumento: carpeta de frames (frames|frames9)}"
SALIDA="${2:?segundo argumento: mp4 de salida}"
ffmpeg -y -framerate 30 -i "$FRAMES/f_%06d.png" -i audio/audio-final.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 19 -preset medium -movflags +faststart \
  -c:a aac -b:a 160k -shortest "$SALIDA"
echo "listo: $SALIDA"
