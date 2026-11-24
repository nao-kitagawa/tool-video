"""Batch Vietnamese TTS with VieNeu-TTS (offline, free).

Usage:
  python tts.py <jobs.json>
jobs.json: {"voice": "Trúc Ly", "speed": 1.08, "items": [{"text": "...", "out": "/abs/s1.wav"}, ...]}
Prints JSON {"durations": [sec, ...]} on the last stdout line.

Voices: python tts.py --list
"""
import json
import subprocess
import sys
import warnings

warnings.filterwarnings("ignore")


def speedup(path: str, speed: float, pitch: float = 1.0):
    """Change speed (tempo) and pitch independently. pitch>1 → higher, younger voice."""
    if abs(speed - 1.0) < 0.01 and abs(pitch - 1.0) < 0.01:
        return
    tmp = path + ".tmp.wav"
    sr = 48000
    filt = f"asetrate={int(sr * pitch)},aresample={sr},atempo={speed / pitch:.4f}"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-filter:a", filt, tmp],
        check=True,
    )
    subprocess.run(["mv", tmp, path], check=True)


def duration(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def main():
    from vieneu import Vieneu

    if sys.argv[1] == "--list":
        tts = Vieneu()
        for v in tts.list_preset_voices():
            print(v)
        return
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    voice = jobs.get("voice") or "Trúc Ly"
    speed = float(jobs.get("speed") or 1.0)
    pitch = float(jobs.get("pitch") or 1.0)
    tts = Vieneu()
    # Pronunciation lexicon (names / English terms / acronyms) → injected before G2P.
    from pathlib import Path

    lex = Path(jobs.get("lexicon") or Path(__file__).resolve().parent.parent / "lexicon" / "pronunciations.json")
    if lex.exists():
        from lexicon import encode, install

        n = install(str(lex))
        print(f"[tts] lexicon: {n} mục", file=sys.stderr, flush=True)
    temperature = 0.8
    expand = 1.0
    post = {}
    if isinstance(voice, str) and voice.startswith("file:"):
        # Channel voice designed with voice_lab.py: blended timbre + style codes + pause tuning.
        vf = json.load(open(voice[5:], encoding="utf-8"))
        voice = {"speaker_emb": vf["speaker_emb"], "codes": vf.get("codes")}
        temperature = vf.get("temperature", 0.8)
        expand = float(vf.get("expand") or 1.0)
        post = {"deepen": vf.get("deepen"), "eq": vf.get("eq"), "dry": vf.get("dry")}
        if vf.get("gaps"):
            import vieneu_utils.core_utils as cu

            cu.V3_GAP_SILENCE.update(vf["gaps"])
    durs = []
    for i, it in enumerate(jobs["items"]):
        print(f"[tts] {i + 1}/{len(jobs['items'])}: {it['text'][:60]}", file=sys.stderr, flush=True)
        text = encode(it["text"]) if lex.exists() else it["text"]
        wav = tts.infer(text, voice=voice, temperature=temperature)
        tts.save(wav, it["out"])
        if expand != 1.0:
            from prosody import expand_pitch

            expand_pitch(it["out"], expand)
        if post.get("deepen"):
            from prosody import deepen

            deepen(it["out"], **post["deepen"])
        if post.get("eq"):
            from prosody import warm_eq

            warm_eq(it["out"], **post["eq"])
        if post.get("dry"):
            from prosody import dry_eq

            dry_eq(it["out"], **post["dry"])
        speedup(it["out"], speed, pitch)
        durs.append(duration(it["out"]))
    print(json.dumps({"durations": durs}))


if __name__ == "__main__":
    main()
