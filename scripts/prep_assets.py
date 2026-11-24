"""Prepare product assets for a project (offline, free).

  python prep_assets.py <projectDir>

Reads <projectDir>/assets/src/*:
  photo*.{png,jpg,...}  → kept as full photos   → assets/photo_<n>.jpg
  anything else         → background removed    → assets/cut_<n>.png (+ bite spots)
Also synthesises crunch SFX → assets/sfx_crunch_<k>.wav
Writes assets/meta.json describing everything.
"""
import json
import math
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image

SR = 44100


def to_rgb8(img: Image.Image) -> Image.Image:
    # 16-bit PNGs come in as mode "I;16" / RGBA with high depth; normalise.
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    return img


def cutout(src: Path, dst: Path, session):
    from rembg import remove

    img = to_rgb8(Image.open(src)).convert("RGB")
    img.thumbnail((1600, 1600))
    out = remove(img, session=session, post_process_mask=True)
    a = np.array(out)[:, :, 3]
    ys, xs = np.where(a > 20)
    pad = 12
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, a.shape[1]), min(ys.max() + pad, a.shape[0]))
    out = out.crop(box)
    out.save(dst)
    return out


def bite_spots(img: Image.Image, n: int = 16):
    """Points on the outer alpha edge (normalised), ordered by angle."""
    a = np.array(img)[:, :, 3] > 40
    h, w = a.shape
    ys, xs = np.where(a)
    cx, cy = xs.mean(), ys.mean()
    spots = []
    for k in range(n):
        ang = -math.pi / 2 + 2 * math.pi * k / n
        dx, dy = math.cos(ang), math.sin(ang)
        r, last = 0.0, None
        while True:
            x, y = int(cx + dx * r), int(cy + dy * r)
            if x < 0 or y < 0 or x >= w or y >= h:
                break
            if a[y, x]:
                last = (x, y)
            r += 1
        if last:
            spots.append({"x": round(last[0] / w, 4), "y": round(last[1] / h, 4), "angle": round(math.degrees(ang), 1)})
    return {"cx": round(cx / w, 4), "cy": round(cy / h, 4), "spots": spots, "aspect": round(h / w, 4)}


def crunch(seed: int, dur=0.42):
    """Dry, crispy crunch: dense cluster of filtered noise micro-bursts."""
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    out = np.zeros(n)
    t_clicks = np.sort(rng.exponential(0.07, 70))
    t_clicks = t_clicks[t_clicks < dur - 0.02]
    for t in t_clicks:
        L = int(SR * rng.uniform(0.002, 0.009))
        burst = rng.normal(0, 1, L)
        burst = np.diff(burst, prepend=0)  # high-pass → crisp
        env = np.exp(-np.linspace(0, rng.uniform(4, 9), L))
        amp = rng.uniform(0.3, 1.0) * math.exp(-t * 5)
        i = int(t * SR)
        out[i : i + L] += burst[: n - i] * env[: n - i] * amp
    # body thump of the bite
    L = int(SR * 0.06)
    tt = np.arange(L) / SR
    out[:L] += 0.35 * np.sin(2 * math.pi * 110 * tt) * np.exp(-tt * 60)
    # smooth a bit (simple 3-tap low-pass to remove harsh aliasing)
    out = np.convolve(out, [0.25, 0.5, 0.25], mode="same")
    out /= np.max(np.abs(out)) + 1e-9
    return (out * 0.9 * 32767).astype(np.int16)


def write_wav(path: Path, data: np.ndarray):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    proj = Path(sys.argv[1]).resolve()
    src = proj / "assets" / "src"
    outdir = proj / "assets"
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
    meta = {"photos": [], "cutouts": [], "sfx": {"crunch": []}}
    session = None
    for p in files:
        if p.stem.lower().startswith("photo"):
            dst = outdir / f"photo_{len(meta['photos'])}.jpg"
            img = to_rgb8(Image.open(p)).convert("RGB")
            img.thumbnail((1800, 1800))
            img.save(dst, quality=90)
            meta["photos"].append({"file": f"assets/{dst.name}", "w": img.width, "h": img.height})
            print(f"[prep] photo  {p.name} → {dst.name}", file=sys.stderr)
        else:
            if session is None:
                from rembg import new_session

                print("[prep] loading rembg model (first run downloads ~170MB)…", file=sys.stderr)
                session = new_session("isnet-general-use")
            dst = outdir / f"cut_{len(meta['cutouts'])}.png"
            img = cutout(p, dst, session)
            meta["cutouts"].append({"file": f"assets/{dst.name}", "w": img.width, "h": img.height, **bite_spots(img)})
            print(f"[prep] cutout {p.name} → {dst.name}", file=sys.stderr)
    for k in range(3):
        f = outdir / f"sfx_crunch_{k}.wav"
        write_wav(f, crunch(k + 7))
        meta["sfx"]["crunch"].append(f"assets/{f.name}")
    (outdir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
