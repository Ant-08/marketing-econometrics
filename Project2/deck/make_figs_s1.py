"""Figures de la section 1 : taux de rachat par classe de récence (palette du thème).
Source : results/01_taux_rachat_par_classe.csv. Lancer avec le python du venv marketing-econometrics."""
import csv, pathlib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = pathlib.Path(__file__).resolve().parent
RES = HERE.parent / "results"
GREEN, ORANGE, SLATE, INK, MUTED, GREY = "#1F7A4D", "#F08A24", "#3F5F7F", "#15201B", "#5F6B64", "#BDC6C0"
plt.rcParams.update({"figure.dpi": 200, "font.family": "Arial", "text.color": INK})

rows = [r for r in csv.DictReader(open(RES / "01_taux_rachat_par_classe.csv", encoding="utf-8")) if r["variable"] == "recence"]
cls = [r["classe"].replace("≤ 7 j", "≤ 7 j").replace("> 180 j", "> 180 j") for r in rows]
rate = [float(r["taux"]) * 100 for r in rows]
share = [float(r["part_clients"]) * 100 for r in rows]
base = 12392 / 160424 * 100  # 7,72 % (01_key_numbers.json)

def f1(x): return f"{x:.1f}".replace(".", ",")

fig, ax = plt.subplots(figsize=(8.0, 4.55))
cols = [ORANGE] + [GREEN] * (len(rate) - 1)
bars = ax.bar(range(len(rate)), rate, color=cols, width=0.68, zorder=3)
for i, v in enumerate(rate):
    ax.text(i, v + 0.5, f1(v) + " %", ha="center", va="bottom", fontsize=13, fontweight="bold", color=ORANGE if i == 0 else GREEN, zorder=5,
            bbox=dict(facecolor="white", edgecolor="none", pad=1.5))
ax.axhline(base, color=SLATE, lw=1.3, ls=(0, (5, 3)), zorder=2)
ax.text(len(rate) - 0.55, base + 0.55, f"Moyenne : {f1(base)} %", ha="right", va="bottom", fontsize=11.5, color=SLATE)
ax.set_xticks(range(len(rate)))
ax.set_xticklabels([f"{c}\n{share[i]:.0f} % des\nclients" for i, c in enumerate(cls)], fontsize=11, color=MUTED)
ax.set_ylim(0, 26)
ax.set_yticks([])
ax.set_xlabel("Ancienneté du dernier achat au 01/08/2020", fontsize=11.5, color=MUTED, labelpad=8)
for s in ("top", "right", "left"):
    ax.spines[s].set_visible(False)
ax.spines["bottom"].set_color(GREY)
ax.tick_params(axis="x", length=0, pad=6)
ax.set_ylabel("Taux de rachat en août 2020", fontsize=11.5, color=MUTED, labelpad=4)
fig.tight_layout()
fig.savefig(HERE / "figs" / "s1_recence_rachat.png", facecolor="white")
print("ok", rate)
