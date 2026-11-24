"""Analyse a source video (e.g. a trailer) so Claude can pick shots.

  python analyze_video.py <video.mp4> <outDir> [--no-asr] [--threshold 27]

Outputs in <outDir>:
  shots.json        [{i, start, end, dur}]  (seconds)
  thumbs/NNN.jpg    middle frame of every shot
  sheet_K.jpg       numbered contact sheets (24 shots each) for visual review
  transcript.json   [{start, end, text}]  speech segments (faster-whisper, offline)
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def detect_shots(video: str, threshold: float):
    from scenedetect import ContentDetector, detect

    scenes = detect(video, ContentDetector(threshold=threshold, min_scene_len=8))
    shots = []
    for i, (a, b) in enumerate(scenes):
        s, e = a.get_seconds(), b.get_seconds()
        shots.append({"i": i, "start": round(s, 3), "end": round(e, 3), "dur": round(e - s, 3)})
    return shots


def thumb(video: str, t: float, out: Path):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-vf", "scale=384:-2", str(out)],
        check=True,
    )


def sheets(shots, tdir: Path, outdir: Path, per=24, cols=6):
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 26)
    except OSError:
        font = ImageFont.load_default()
    files = []
    for k in range(0, len(shots), per):
        chunk = shots[k : k + per]
        ims = [Image.open(tdir / f"{s['i']:03d}.jpg") for s in chunk]
        w, h = ims[0].size
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * w, rows * (h + 34)), "black")
        d = ImageDraw.Draw(sheet)
        for j, (s, im) in enumerate(zip(chunk, ims)):
            x, y = (j % cols) * w, (j // cols) * (h + 34)
            sheet.paste(im, (x, y + 34))
            d.text((x + 6, y + 4), f"#{s['i']}  {s['start']:.1f}s  ({s['dur']:.1f}s)", fill="yellow", font=font)
        f = outdir / f"sheet_{k // per}.jpg"
        sheet.save(f, quality=85)
        files.append(str(f))
    return files


def transcribe(video: str):
    from faster_whisper import WhisperModel

    import numpy as np

    # Decode with system ffmpeg (avoids PyAV version issues) → 16 kHz mono float32.
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", video, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, vad_filter=True, word_timestamps=False)
    return [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in segs]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--no-asr", action="store_true")
    ap.add_argument("--threshold", type=float, default=27.0)
    a = ap.parse_args()
    out = Path(a.out)
    tdir = out / "thumbs"
    tdir.mkdir(parents=True, exist_ok=True)

    if (out / "shots.json").exists() and (out / "sheet_0.jpg").exists():
        shots = json.loads((out / "shots.json").read_text())
        print("[analyze] reuse shots.json", file=sys.stderr)
        files = sorted(str(p) for p in out.glob("sheet_*.jpg"))
    else:
        print("[analyze] detecting shots…", file=sys.stderr)
        shots = detect_shots(a.video, a.threshold)
        (out / "shots.json").write_text(json.dumps(shots, indent=1))
        print(f"[analyze] {len(shots)} shots", file=sys.stderr)
        for s in shots:
            thumb(a.video, s["start"] + s["dur"] / 2, tdir / f"{s['i']:03d}.jpg")
        files = sheets(shots, tdir, out)
    print(f"[analyze] sheets: {files}", file=sys.stderr)

    if not a.no_asr:
        print("[analyze] transcribing (first run downloads whisper small.en ~480MB)…", file=sys.stderr)
        tr = transcribe(a.video)
        (out / "transcript.json").write_text(json.dumps(tr, indent=1, ensure_ascii=False))
        print(f"[analyze] {len(tr)} speech segments", file=sys.stderr)


if __name__ == "__main__":
    main()
