"""Batch image generation with Z-Image Turbo (mflux), model loaded ONCE.

  .venv-img/bin/python scripts/gen_images.py <jobs.json> <outDir> [--character brand/tictac/character.json]

jobs.json: {"defaults": {"width": 1280, "height": 720, "steps": 6, "seed": 11},
            "style": "…style block…",
            "jobs": [{"name": "s01", "prompt": "… {CHAR} …", "seed": 11}, …]}
"{CHAR}" in a prompt is replaced by the canonical character block (character.json "prompt"),
"{STYLE}" by jobs.json "style" (or character.json "style"). Existing outputs are skipped,
so the batch can be resumed or split across machines.
"""
import json
import sys
import time
from pathlib import Path

MODEL = "filipstrand/Z-Image-Turbo-mflux-4bit"


def main():
    jobs_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    char = {}
    if "--character" in sys.argv:
        char = json.loads(Path(sys.argv[sys.argv.index("--character") + 1]).read_text(encoding="utf-8"))
    cfg = json.loads(jobs_path.read_text(encoding="utf-8"))
    d = {"width": 1280, "height": 720, "steps": 6, "seed": 11, **cfg.get("defaults", {})}
    style = cfg.get("style") or char.get("style", "")
    out_dir.mkdir(parents=True, exist_ok=True)

    todo = [j for j in cfg["jobs"] if not (out_dir / f"{j['name']}.png").exists()]
    if not todo:
        print("[img] nothing to do", file=sys.stderr)
        return

    from mflux.models.z_image.cli.z_image_turbo_generate import ZImageTurboCommand, build_parser

    # mflux's CommandLineParser.parse_args() reads sys.argv only
    saved = sys.argv
    sys.argv = ["mflux", "--model", MODEL, "--base-model", "z-image-turbo", "--prompt", "x"]
    try:
        args = build_parser().parse_args()
    finally:
        sys.argv = saved
    model = ZImageTurboCommand.load(args)
    for k, j in enumerate(todo):
        p = j["prompt"].replace("{CHAR}", char.get("prompt", "")).replace("{STYLE}", style)
        if "{STYLE}" not in j["prompt"] and style:
            p = f"{style} {p}"
        args.width = j.get("width", d["width"])
        args.height = j.get("height", d["height"])
        args.steps = j.get("steps", d["steps"])
        t = time.time()
        img = ZImageTurboCommand.generate(model, args, int(j.get("seed", d["seed"])), p)
        img.save(path=str(out_dir / f"{j['name']}.png"), export_json_metadata=False)
        print(f"[img] {k + 1}/{len(todo)} {j['name']} {time.time() - t:.0f}s", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
