"""Verify every lexicon entry with the channel voice + Whisper, pick the best variant.

  python verify_lexicon.py [--voice voices/booker_raw.json] [--only Fremen,IMAX] [--no-write]

For each non-"en" entry, every candidate (ipa, vi0, vi1, …) is spoken alone in a short
carrier, transcribed by Whisper (English), and scored by spelling similarity to the key.
Writes lexicon/verify_report.md, updates "use" in pronunciations.json (unless the entry
has "lock": true or a "note" starting with "user:"), and builds lexicon/listen_check.wav
(every entry with its chosen pronunciation, in report order) for a final human pass.
"""
import argparse
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
LEX = ROOT / "lexicon" / "pronunciations.json"
OUT = ROOT / "lexicon" / "verify"


def letters(s):
    return re.sub(r"[^a-z]", "", s.lower())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=str(ROOT / "voices" / "booker_raw.json"))
    ap.add_argument("--only", default="")
    ap.add_argument("--no-write", action="store_true")
    a = ap.parse_args()

    from faster_whisper import WhisperModel
    from vieneu import Vieneu

    import lexicon as L

    L.install(str(LEX))
    raw = json.loads(LEX.read_text(encoding="utf-8"))
    vf = json.loads(Path(a.voice).read_text(encoding="utf-8"))
    voice = {"speaker_emb": vf["speaker_emb"], "codes": vf.get("codes")}
    tts = Vieneu()
    asr = WhisperModel("small", device="cpu", compute_type="int8")
    OUT.mkdir(parents=True, exist_ok=True)
    only = {w.strip().lower() for w in a.only.split(",") if w.strip()}

    report = ["| Từ | Phương án | Whisper nghe được | Điểm | Chọn |", "|---|---|---|---|---|"]
    chosen_wavs = []
    for key, v in raw.items():
        if key.startswith("_") or v == "en" or not isinstance(v, dict):
            continue
        if only and key.lower() not in only:
            continue
        vis = v.get("vi") or []
        vis = [vis] if isinstance(vis, str) else vis
        cands = (["ipa"] if v.get("ipa") else []) + [f"vi{i}" for i in range(len(vis))]
        results = []
        for c in cands:
            kind, val = L.candidate(v, c)
            ph = L._placeholder(kind, val)
            wav = tts.infer(f"{ph}.", voice=voice, temperature=0.7)
            f = OUT / f"{letters(key)}_{c}.wav"
            tts.save(wav, str(f))
            pcm = np.asarray(wav, dtype=np.float32)
            # whisper wants 16 kHz
            x16 = np.interp(np.arange(0, len(pcm), 48000 / 16000), np.arange(len(pcm)), pcm).astype(np.float32)
            segs, _ = asr.transcribe(x16, language="en", initial_prompt="Dune, Arrakis, Atreides, Fremen, IMAX.")
            heard = " ".join(s.text.strip() for s in segs)
            score = difflib.SequenceMatcher(None, letters(key), letters(heard)).ratio()
            results.append((score, c, val, heard, f))
        best = max(results, key=lambda r: r[0])
        locked = v.get("lock") or str(v.get("note", "")).startswith("user:")
        pick = v.get("use") if locked else best[1]
        for score, c, val, heard, f in results:
            mark = "✅" if c == pick else ""
            report.append(f"| {key} | {c}: {val} | {heard} | {score:.2f} | {mark}{' (khoá)' if locked and c == pick else ''} |")
            if c == pick:
                chosen_wavs.append((key, f))
        if not locked:
            v["use"] = pick
        print(f"[verify] {key:18} → {pick:4} ({best[0]:.2f})", file=sys.stderr, flush=True)

    (ROOT / "lexicon" / "verify_report.md").write_text("\n".join(report), encoding="utf-8")
    if not a.no_write:
        LEX.write_text(json.dumps(raw, ensure_ascii=False, indent=1), encoding="utf-8")
    # one listening file: each chosen word + 0.6 s gap
    lst = OUT / "concat.txt"
    sil = OUT / "_sil.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.6", str(sil)], check=True)
    lst.write_text("".join(f"file '{f}'\nfile '{sil}'\n" for _, f in chosen_wavs))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:a", "pcm_s16le", str(ROOT / "lexicon" / "listen_check.wav")], check=True)
    (ROOT / "lexicon" / "listen_check_order.txt").write_text("\n".join(f"{i + 1}. {k}" for i, (k, _) in enumerate(chosen_wavs)), encoding="utf-8")


if __name__ == "__main__":
    main()
