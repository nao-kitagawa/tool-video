"""Synthesize a copyright-free ambient bed (dark drone + desert wind), loopable.

  python make_ambient.py <out.wav> [--sec 180] [--root 73.42] [--seed 3]

Royalty-free because it is generated here: low detuned pads in a minor chord,
slow amplitude/filter motion, band-passed noise "wind", gentle sub pulse.
"""
import argparse
import wave

import numpy as np

SR = 48000


def onepole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--sec", type=float, default=180)
    ap.add_argument("--root", type=float, default=73.42)  # D2
    ap.add_argument("--seed", type=int, default=3)
    a = ap.parse_args()
    rng = np.random.default_rng(a.seed)
    n = int(SR * a.sec)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)

    # Pad: D minor-ish stack, each voice = 3 detuned saws (approximated with few harmonics)
    ratios = [1, 1.5, 2, 2.378, 3]  # root, fifth, octave, minor third (oct), fifth (oct)
    for k, r in enumerate(ratios):
        f0 = a.root * r
        lfo = 0.55 + 0.45 * np.sin(2 * np.pi * (0.013 + 0.007 * k) * t + rng.uniform(0, 6.28))
        for det, pan in [(-0.12, 0.3), (0.0, 0.5), (0.11, 0.7)]:
            f = f0 * (2 ** (det / 12))
            ph = rng.uniform(0, 6.28)
            v = sum(np.sin(2 * np.pi * f * h * t + ph * h) / (h ** 1.6) for h in range(1, 6))
            amp = 0.05 / (1 + k * 0.6) * lfo
            L += v * amp * (1 - pan)
            R += v * amp * pan

    # Wind: noise band-limited, slowly swelling
    noise = rng.normal(0, 1, n)
    wind = onepole_lp(noise, 900) - onepole_lp(noise, 180)
    swell = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.021 * t)) ** 2
    wind *= 0.18 * swell
    L += wind * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t))
    R += wind * (0.6 + 0.4 * np.cos(2 * np.pi * 0.05 * t))

    # Sub pulse (heartbeat every ~2.2s)
    beat = np.zeros(n)
    period = int(SR * 2.2)
    env_len = int(SR * 0.5)
    env = np.exp(-np.linspace(0, 7, env_len)) * np.sin(2 * np.pi * 46 * np.arange(env_len) / SR)
    for s in range(0, n - env_len, period):
        beat[s : s + env_len] += env
    L += beat * 0.12
    R += beat * 0.12

    # Seamless loop: crossfade tail into head
    xf = int(SR * 4)
    fade = np.linspace(0, 1, xf)
    for ch in (L, R):
        ch[:xf] = ch[:xf] * fade + ch[-xf:] * (1 - fade)
    L, R = L[:-xf], R[:-xf]

    peak = max(np.abs(L).max(), np.abs(R).max())
    st = np.stack([L, R], 1) / peak * 0.8
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print(a.out, f"{len(L) / SR:.1f}s")


if __name__ == "__main__":
    main()
