"""Score niches from niche_scan output.

  python niche_score.py <scan.jsonl> [--today 2026-11-25]
"""
import collections
import datetime as dt
import json
import math
import statistics as st
import sys


def main():
    path = sys.argv[1]
    today = dt.date.fromisoformat(sys.argv[sys.argv.index("--today") + 1]) if "--today" in sys.argv else dt.date.today()
    by = collections.defaultdict(dict)
    for line in open(path, encoding="utf-8"):
        v = json.loads(line)
        if v.get("views") is None or not v.get("upload_date"):
            continue
        by[v["niche"]][v["id"]] = v  # dedupe per niche
    rows = []
    for niche, vids in by.items():
        vs = list(vids.values())
        for v in vs:
            d = v["upload_date"]
            age = max(1, (today - dt.date(int(d[:4]), int(d[4:6]), int(d[6:]))).days)
            v["age"] = age
            v["vpd"] = v["views"] / age
        recent = [v for v in vs if v["age"] <= 365]
        vpd = st.median([v["vpd"] for v in recent]) if recent else 0
        out = [v for v in vs if v.get("subs") and v["subs"] < 200_000 and v["views"] >= 3 * v["subs"]]
        small_win = [v for v in vs if (v.get("subs") or 0) < 100_000 and v["views"] >= 100_000]
        ch = collections.Counter(v["channel"] for v in vs)
        top_share = ch.most_common(1)[0][1] / len(vs)
        big = [v for v in vs if (v.get("subs") or 0) >= 1_000_000]
        rows.append({
            "niche": niche, "n": len(vs), "channels": len(ch),
            "median_views": st.median(v["views"] for v in vs),
            "p90_views": sorted(v["views"] for v in vs)[int(len(vs) * 0.9) - 1],
            "recent_share": len(recent) / len(vs), "vpd_recent": vpd,
            "outlier_rate": len(out) / len(vs), "small_winners": len(small_win),
            "top_share": top_share, "big_ch_share": len(big) / len(vs),
            "median_min": st.median((v["duration"] or 0) / 60 for v in vs),
            "examples": sorted(out, key=lambda v: -v["views"] / max(1, v["subs"]))[:3],
        })
    # opportunity score (0-100): recent demand, small-channel wins, low concentration
    def norm(key, log=False):
        xs = [math.log10(r[key] + 1) if log else r[key] for r in rows]
        lo, hi = min(xs), max(xs)
        for r, x in zip(rows, xs):
            r[f"_{key}"] = (x - lo) / (hi - lo + 1e-9)
    norm("vpd_recent", log=True)
    norm("outlier_rate")
    norm("small_winners")
    norm("median_views", log=True)
    for r in rows:
        r["score"] = round(100 * (0.35 * r["_vpd_recent"] + 0.25 * r["_outlier_rate"] + 0.15 * r["_small_winners"]
                                 + 0.10 * r["_median_views"] + 0.15 * (1 - r["top_share"])), 1)
    rows.sort(key=lambda r: -r["score"])
    print(f"{'Ngách':34} {'điểm':>5} {'view TB':>9} {'view/ngày*':>10} {'mới%':>5} {'kênh nhỏ thắng':>14} {'outlier%':>8} {'top1%':>6} {'kênh≥1M%':>8} {'phút':>5}")
    for r in rows:
        print(f"{r['niche'][:34]:34} {r['score']:5.1f} {r['median_views']:9,.0f} {r['vpd_recent']:10,.0f} {r['recent_share']*100:4.0f}% {r['small_winners']:14d} {r['outlier_rate']*100:7.0f}% {r['top_share']*100:5.0f}% {r['big_ch_share']*100:7.0f}% {r['median_min']:5.1f}")
    print("\n* view/ngày: trung vị của video đăng trong 12 tháng gần nhất\n")
    for r in rows[:10]:
        ex = "; ".join(f"{e['channel']} ({(e['subs'] or 0):,} sub → {e['views']:,} view): {e['title'][:60]}" for e in r["examples"])
        print(f"- {r['niche']}: {ex or '—'}")
    json.dump(rows, open(path.replace(".jsonl", "_scored.json"), "w"), ensure_ascii=False, indent=1, default=str)


if __name__ == "__main__":
    main()
