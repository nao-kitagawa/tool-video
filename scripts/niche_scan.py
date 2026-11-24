"""Scan YouTube niches (full metadata via yt-dlp) and score opportunity.

  python niche_scan.py <niches.json> <out.jsonl> [--n 12]

niches.json: {"niche name": ["query 1", "query 2"], ...}
Writes one JSON line per video: niche, id, title, channel, subs, views, upload_date, duration.
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

YTDLP = str(Path(__file__).resolve().parent.parent / ".venv" / "bin" / "yt-dlp")


def search(q, n):
    try:
        r = subprocess.run(
            [YTDLP, "--js-runtimes", "node", "--skip-download", "--no-warnings", "-j", f"ytsearch{n}:{q}"],
            capture_output=True, text=True, timeout=180,
        )
    except subprocess.TimeoutExpired as e:
        print(f"[scan] timeout: {q}", file=sys.stderr, flush=True)
        r = subprocess.CompletedProcess(e.cmd, 1, stdout=(e.stdout or b"").decode() if isinstance(e.stdout, bytes) else (e.stdout or ""))
    out = []
    for line in r.stdout.splitlines()[:n]:
        try:
            d = json.loads(line)
        except Exception:
            continue
        out.append({
            "id": d.get("id"), "title": d.get("title"), "channel": d.get("channel"),
            "subs": d.get("channel_follower_count"), "views": d.get("view_count"),
            "likes": d.get("like_count"), "comments": d.get("comment_count"),
            "upload_date": d.get("upload_date"), "duration": d.get("duration"), "query": q,
        })
    return out


def main():
    niches = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    n = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 12
    jobs = [(name, q) for name, qs in niches.items() for q in qs]
    with ThreadPoolExecutor(max_workers=4) as ex, out.open("w", encoding="utf-8") as f:
        for (name, q), vids in zip(jobs, ex.map(lambda j: search(j[1], n), jobs)):
            for v in vids:
                f.write(json.dumps({"niche": name, **v}, ensure_ascii=False) + "\n")
            print(f"[scan] {name} | {q}: {len(vids)}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
