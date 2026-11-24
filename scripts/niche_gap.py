"""Market-cloning gap: US demand vs VN supply per niche.

  python niche_gap.py us_scored.json vn_scored.json [vn2_scored.json ...]
"""
import json
import math
import sys


def main():
    us = {r["niche"]: r for r in json.load(open(sys.argv[1]))}
    vn = {}
    for p in sys.argv[2:]:
        for r in json.load(open(p)):
            vn[r["niche"]] = r
    rows = []
    for k, u in us.items():
        v = vn.get(k)
        rows.append((k, u, v))

    def lg(x):
        return math.log10((x or 0) + 1)

    us_vpd = [lg(u["vpd_recent"]) for _, u, _ in rows]
    lo, hi = min(us_vpd), max(us_vpd)
    out = []
    for (k, u, v), x in zip(rows, us_vpd):
        demand = (x - lo) / (hi - lo + 1e-9)
        small = u["outlier_rate"]
        if v:
            vn_heat = min(1.0, lg(v["vpd_recent"]) / 4.0)  # 10k views/day ≈ saturated
            vn_crowd = min(1.0, v["channels"] / 20)
            supply = 0.6 * vn_heat + 0.4 * (1 - v["outlier_rate"])
        else:
            vn_heat, supply = 0.0, 0.0
        gap = round(100 * (0.45 * demand + 0.25 * small + 0.30 * (1 - supply)), 1)
        out.append((gap, k, u, v))
    out.sort(key=lambda r: -r[0])
    print(f"{'Ngách':36} {'GAP':>5} | {'US view/ngày':>12} {'US outlier':>10} {'US kênh nhỏ thắng':>17} | {'VN view/ngày':>12} {'VN outlier':>10} {'VN view TB':>10}")
    for gap, k, u, v in out:
        vs = f"{v['vpd_recent']:12,.0f} {v['outlier_rate']*100:9.0f}% {v['median_views']:10,.0f}" if v else f"{'—':>12} {'—':>10} {'—':>10}"
        print(f"{k[:36]:36} {gap:5.1f} | {u['vpd_recent']:12,.0f} {u['outlier_rate']*100:9.0f}% {u['small_winners']:17d} | {vs}")
    print()
    for gap, k, u, v in out[:8]:
        ex = "; ".join(f"{e['channel']} ({(e['subs'] or 0):,} sub → {e['views']:,} view, {e['upload_date']}): {e['title'][:55]}" for e in u["examples"][:2])
        print(f"- {k}: {ex}")


if __name__ == "__main__":
    main()
