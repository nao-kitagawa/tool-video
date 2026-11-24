"""Pronunciation lexicon for VieNeu TTS (names, English terms, acronyms).

lexicon/pronunciations.json entries (case-insensitive keys, multi-word OK):
  "Dune": "en"                                  # built-in English G2P is already right
  "IMAX": {"ipa": "ˈaɪmæks", "vi": "ai mắc", "use": "ipa"}
  "Fremen": {"ipa": "fɹˈɛmən", "vi": "phờ rê men", "use": "vi"}
  (legacy strings "ipa:…" / "vi:…" still accepted)

Pipeline (fixes normalizer mangling, e.g. IMAX → "i mờ a ích"):
  encode(text)  BEFORE VieNeu normalisation: lexicon words + unknown ALL-CAPS acronyms
                → placeholder tokens that survive the normalizer untouched
  install()     patch VieNeu's phonemizer: placeholder → IPA (or phonemized Vietnamese respelling)
check(text)     list foreign-looking words NOT covered by the lexicon (pre-flight).
"""
import json
import re
from pathlib import Path

_LEX: dict = {}
_RE = None
_PH: dict = {}  # placeholder -> ("ipa"|"vi", value)
_PH_RE = re.compile(r"qxlex[a-z]+qx")

LETTER_IPA = {
    "A": "eɪ", "B": "biː", "C": "siː", "D": "diː", "E": "iː", "F": "ɛf", "G": "dʒiː", "H": "eɪtʃ", "I": "aɪ",
    "J": "dʒeɪ", "K": "keɪ", "L": "ɛl", "M": "ɛm", "N": "ɛn", "O": "oʊ", "P": "piː", "Q": "kjuː", "R": "ɑːɹ",
    "S": "ɛs", "T": "tiː", "U": "juː", "V": "viː", "W": "dʌbəljuː", "X": "ɛks", "Y": "waɪ", "Z": "ziː",
}


def _entry(v):
    """Normalise an entry to (kind, value) or None for 'en'."""
    if v == "en":
        return None
    if isinstance(v, dict):
        use = v.get("use") or ("ipa" if v.get("ipa") else "vi0")
        return candidate(v, use)
    if v.startswith("ipa:"):
        return "ipa", v[4:]
    if v.startswith("vi:"):
        return "vi", v[3:]
    return "vi", v


def candidate(v: dict, use: str):
    """use: 'ipa' | 'vi' | 'vi0', 'vi1'… → (kind, value)."""
    if use == "ipa":
        return "ipa", v["ipa"]
    vis = v.get("vi") or []
    vis = [vis] if isinstance(vis, str) else vis
    i = int(use[2:] or 0) if use.startswith("vi") else 0
    return "vi", vis[min(i, len(vis) - 1)]


def load(path):
    global _LEX, _RE
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    _LEX = {k.lower(): v for k, v in raw.items() if not k.startswith("_")}
    keys = sorted((k for k, v in _LEX.items() if v != "en"), key=len, reverse=True)
    _RE = re.compile(r"(?<![\w'])(" + "|".join(re.escape(k) for k in keys) + r")(?![\w'])", re.IGNORECASE) if keys else None
    return _LEX


def _placeholder(kind, value):
    for ph, kv in _PH.items():
        if kv == (kind, value):
            return ph
    n = len(_PH)
    s = ""
    while True:
        s = chr(97 + n % 26) + s
        n //= 26
        if n == 0:
            break
    ph = f"qxlex{s}qx"
    _PH[ph] = (kind, value)
    return ph


def acronym_ipa(word):
    letters = [LETTER_IPA[c] for c in word if c in LETTER_IPA]
    if not letters:
        return None
    letters[-1] = "ˈ" + letters[-1]
    return "".join(letters[:-1]) + letters[-1] if len(letters) > 1 else letters[0]


def encode(text: str) -> str:
    """Replace lexicon words / unknown acronyms with normalizer-proof placeholders."""
    if _RE:
        text = _RE.sub(lambda m: " " + _placeholder(*_entry(_LEX[m.group(1).lower()])) + " ", text)

    def acr(m):
        w = m.group(0)
        if w.lower() in _LEX:
            return w
        ipa = acronym_ipa(w)
        return " " + _placeholder("ipa", ipa) + " " if ipa else w

    text = re.sub(r"(?<![\w'])[A-Z]{2,6}(?![\w'])", acr, text)
    return re.sub(r"[ \t]{2,}", " ", text).replace(" ,", ",").replace(" .", ".")


def install(path):
    """Patch vieneu_utils.phonemize_text._phonemize_cached so placeholders become IPA."""
    load(path)
    import vieneu_utils.phonemize_text as pt
    from sea_g2p import punc_norm as _punc_norm

    orig = getattr(pt, "_orig_phonemize_cached", pt._phonemize_cached)
    pt._orig_phonemize_cached = orig

    def patched(text, punc_norm=True):
        if not _PH_RE.search(text):
            return orig(text, punc_norm)
        out, pos = [], 0
        for m in _PH_RE.finditer(text):
            before = text[pos : m.start()]
            if before.strip(" "):
                out.append(orig(before, False).rstrip("."))
            kind, val = _PH.get(m.group(0), ("vi", ""))
            out.append(val if kind == "ipa" else orig(val, False).rstrip("."))
            pos = m.end()
        tail = text[pos:]
        if tail.strip(" "):
            out.append(orig(tail, False))
        ph = " ".join(p.strip() for p in out if p.strip())
        ph = re.sub(r"\s+([.,!?;:…])", r"\1", ph)
        return _punc_norm(ph) if punc_norm else ph

    pt._phonemize_cached = patched
    return len(_LEX)


# --- pre-flight check -------------------------------------------------------

_VI_CHARS = set("ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ")


def _looks_vietnamese(w: str) -> bool:
    lw = w.lower()
    if any(c in _VI_CHARS for c in lw):
        return True
    if not lw.isalpha() or any(c in "fjwz" for c in lw):
        return False
    return bool(re.fullmatch(r"(ngh|ng|nh|ch|tr|th|ph|kh|gh|gi|qu|[bcdđghklmnprstvx])?([aeiouy]{1,3})(ch|ng|nh|[cmnpt])?", lw))


def check(text: str, lexicon_path=None):
    if lexicon_path:
        load(lexicon_path)
    covered = set(_LEX)
    issues = {}
    plain = re.sub(r"\[[^\]]+\]", " ", text)
    for m in re.finditer(r"[A-Za-zÀ-ỹ'’-]+", plain):
        w = m.group(0).strip("'’-")
        if not w or w.lower() in covered:
            continue
        if (len(w) >= 2 and w.isupper()) or not _looks_vietnamese(w):
            if any(w.lower() in k.split() for k in covered):
                continue
            issues[w] = issues.get(w, 0) + 1
    return issues


if __name__ == "__main__":
    import sys

    lex = sys.argv[1]
    src = sys.argv[2]
    txt = Path(src).read_text(encoding="utf-8")
    if src.endswith(".json"):
        txt = "\n".join(s.get("voice", "") for s in json.loads(txt).get("scenes", []))
    for w, n in sorted(check(txt, lex).items(), key=lambda x: -x[1]):
        print(f"{n:3}× {w}")
