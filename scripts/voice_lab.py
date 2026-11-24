"""Design a channel voice by blending VieNeu preset timbres (a new voice that
belongs to no real person) + choosing a prosody reference + pause/variation tuning.

  python voice_lab.py <recipes.json> <outDir>

recipes.json: {"text": "...", "recipes": [
  {"name": "A", "mix": {"Thiện Minh": 0.55, "Thanh Bình": 0.45}, "style": "Thiện Minh",
   "temperature": 0.85, "gaps": {"para": 0.8, "sentence": 0.55, "minor": 0.35}, "text": "optional override"}
]}
A recipe can also be saved as a reusable voice file (voices/<name>.json) and passed to
tts.py as "voice": "file:voices/<name>.json".
"""
import json
import sys
from pathlib import Path

import numpy as np


def build_voice(tts, recipe):
    mix = recipe["mix"]
    embs, ws = [], []
    for name, w in mix.items():
        embs.append(np.asarray(tts.get_preset_voice(name)["speaker_emb"], dtype=np.float32))
        ws.append(float(w))
    ws = np.asarray(ws) / sum(ws)
    emb = sum(w * e for w, e in zip(ws, embs))
    # keep the typical vector norm so the blend isn't "averaged towards silence"
    emb = emb / (np.linalg.norm(emb) + 1e-9) * np.mean([np.linalg.norm(e) for e in embs])
    style = tts.get_preset_voice(recipe.get("style") or next(iter(mix)))
    codes = style.get("codes")
    return {"speaker_emb": emb.tolist(), "codes": None if codes is None else np.asarray(codes).tolist()}


def apply_gaps(gaps):
    if not gaps:
        return
    import vieneu_utils.core_utils as cu

    cu.V3_GAP_SILENCE.update(gaps)


def main():
    from vieneu import Vieneu

    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    tts = Vieneu()
    lex = Path(__file__).resolve().parent.parent / "lexicon" / "pronunciations.json"
    if lex.exists():
        from lexicon import install

        install(str(lex))
    from lexicon import encode
    for r in cfg["recipes"]:
        voice = build_voice(tts, r)
        apply_gaps(r.get("gaps"))
        wav = tts.infer(encode(r.get("text") or cfg["text"]), voice=voice, temperature=r.get("temperature", 0.8))
        f = out / f"{r['name']}.wav"
        tts.save(wav, f)
        if r.get("expand"):
            from prosody import expand_pitch

            expand_pitch(str(f), float(r["expand"]))
        if r.get("save"):
            vf = Path(r["save"])
            vf.parent.mkdir(parents=True, exist_ok=True)
            vf.write_text(json.dumps({**voice, "temperature": r.get("temperature", 0.8), "gaps": r.get("gaps"), "expand": r.get("expand"), "recipe": r}, ensure_ascii=False))
        print("ok", f, file=sys.stderr)


if __name__ == "__main__":
    main()
