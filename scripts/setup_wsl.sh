#!/usr/bin/env bash
# Setup on Windows PC + NVIDIA GPU, inside WSL2 Ubuntu (22.04/24.04).
# Prereq on Windows: recent NVIDIA driver (WSL CUDA support is provided by the Windows driver —
# do NOT install a Linux display driver inside WSL). Check with: nvidia-smi
# Keep the repo inside the Linux filesystem (~/tool-video), NOT /mnt/c (very slow I/O).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> apt packages"
sudo apt-get update
sudo apt-get install -y ffmpeg git curl build-essential software-properties-common \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 fonts-noto || true
# Python 3.13 (deadsnakes) — VieNeu/rembg/whisper were tested on 3.13
if ! command -v python3.13 >/dev/null; then
  sudo add-apt-repository -y ppa:deadsnakes/ppa && sudo apt-get update
  sudo apt-get install -y python3.13 python3.13-venv python3.13-dev
fi
# Node 22 via nvm
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install 22
fi

echo "==> npm (Remotion) + headless Chrome"
npm ci
npx remotion browser ensure || true

echo "==> .venv (yt-dlp, edge-tts)"
python3.13 -m venv .venv && .venv/bin/pip install -q -r requirements/venv-tools.txt

echo "==> .venv-tts (VieNeu GPU, rembg, scenedetect, faster-whisper CUDA, parselmouth)"
python3.13 -m venv .venv-tts
.venv-tts/bin/pip install -q -r requirements/venv-tts.txt
.venv-tts/bin/pip install -q "vieneu[gpu]" onnxruntime-gpu || echo "!! vieneu[gpu]/onnxruntime-gpu failed — CPU mode still works"

echo "==> .venv-img (diffusers + PyTorch CUDA instead of mflux/mlx, which are Mac-only)"
python3.13 -m venv .venv-img
.venv-img/bin/pip install -q --index-url https://download.pytorch.org/whl/cu128 torch torchvision
.venv-img/bin/pip install -q -U diffusers transformers accelerate safetensors sentencepiece pillow
echo "   NOTE: scripts/gen_images.py currently uses mflux (Mac). Add a diffusers backend for"
echo "   Tongyi-MAI/Z-Image-Turbo (Apache-2.0) keeping the same jobs.json/{CHAR} format — see HANDOFF.md."

.venv-tts/bin/python -c "import torch,sys; print('torch cuda (tts venv):', torch.cuda.is_available())" 2>/dev/null || true
.venv-img/bin/python -c "import torch; print('torch cuda (img venv):', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else '')"
echo "Done."
