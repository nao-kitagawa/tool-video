"""Post-processing to make TTS intonation more expressive.

expand_pitch(path, k): widen the pitch contour around the median (k>1 = more melodic,
k=1 unchanged) with Praat PSOLA, timbre and timing preserved.
"""
import parselmouth
from parselmouth.praat import call


def expand_pitch(path: str, k: float, floor: float = 65, ceiling: float = 320):
    if abs(k - 1.0) < 0.01:
        return
    snd = parselmouth.Sound(path)
    manip = call(snd, "To Manipulation", 0.01, floor, ceiling)
    tier = call(manip, "Extract pitch tier")
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=floor, pitch_ceiling=ceiling)
    med = call(pitch, "Get quantile", 0, 0, 0.5, "Hertz")
    if not med or med != med:  # NaN
        return
    call(tier, "Formula", f"{med} * (self / {med}) ^ {k}")
    call([tier, manip], "Replace pitch tier")
    out = call(manip, "Get resynthesis (overlap-add)")
    out.save(path, "WAV")


WARM_EQ = (
    "highpass=f=60,"
    "equalizer=f=170:t=q:w=1.0:g={low},"
    "equalizer=f=320:t=q:w=1.2:g={lowmid},"
    "equalizer=f=3500:t=q:w=1.5:g=-1.5,"
    "highshelf=f=8000:g=-2.5,"
    "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=2"
)


def deepen(path: str, semitones: float = -1.5, formant: float = 0.96, floor: float = 65, ceiling: float = 320):
    """Lower pitch (semitones) and formants (ratio <1 = bigger/deeper body), timing kept."""
    if abs(semitones) < 0.01 and abs(formant - 1) < 0.001:
        return
    snd = parselmouth.Sound(path)
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=floor, pitch_ceiling=ceiling)
    med = call(pitch, "Get quantile", 0, 0, 0.5, "Hertz")
    new_med = med * (2 ** (semitones / 12))
    out = call(snd, "Change gender", floor, ceiling, formant, new_med, 1.0, 1.0)
    out.save(path, "WAV")


def warm_eq(path: str, low: float = 3.0, lowmid: float = 1.5):
    import subprocess

    tmp = path + ".eq.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", WARM_EQ.format(low=low, lowmid=lowmid), tmp], check=True)
    subprocess.run(["mv", tmp, path], check=True)


DRY_EQ = (
    "highpass=f=70,"
    "equalizer=f=140:t=q:w=1.0:g={low},"
    "equalizer=f=420:t=q:w=1.2:g=-{mud},"
    "equalizer=f=3200:t=q:w=1.5:g=-1,"
    "highshelf=f=9000:g=-2"
)


def dry_eq(path: str, low: float = 2.0, mud: float = 2.5, gate: bool = True):
    """Warm but DRY: modest low warmth, cut boxy 400Hz, optional downward expander to tame tails."""
    import subprocess

    af = DRY_EQ.format(low=low, mud=mud)
    if gate:
        # gentle downward expansion below -40dB: shortens reverb tails between words
        af += ",agate=threshold=0.012:ratio=2:attack=5:release=120:range=0.25"
    tmp = path + ".eq.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", af, tmp], check=True)
    subprocess.run(["mv", tmp, path], check=True)
