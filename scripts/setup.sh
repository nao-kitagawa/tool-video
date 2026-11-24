#!/usr/bin/env bash
# One-shot setup on a new Mac (Apple Silicon). Requires: Homebrew, Node 22, python3.13, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v ffmpeg >/dev/null || brew install ffmpeg
PY313=$(command -v python3.13 || echo /opt/homebrew/bin/python3.13)
PY=$(command -v python3)

echo "==> npm (Remotion)"
npm ci

echo "==> .venv (yt-dlp, edge-tts)"
$PY -m venv .venv && .venv/bin/pip install -q -r requirements/venv-tools.txt

echo "==> .venv-tts (VieNeu, rembg, scenedetect, faster-whisper, parselmouth)"
$PY313 -m venv .venv-tts && .venv-tts/bin/pip install -q -r requirements/venv-tts.txt

echo "==> .venv-img (mflux — local image generation)"
$PY313 -m venv .venv-img && .venv-img/bin/pip install -q -r requirements/venv-img.txt

echo "Done. First runs download models: VieNeu (~2.4GB), rembg (~180MB), Whisper small (~480MB),"
echo "Z-Image Turbo 4-bit (~5.9GB), Remotion Chrome headless (~140MB)."
