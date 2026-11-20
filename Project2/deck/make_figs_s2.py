"""Figures de la section 2 du deck (slides 6 à 9), palette verte du thème.

Lancer avec :
  PYTHONPYCACHEPREFIX=$HOME/.cache/pycache MPLCONFIGDIR=$HOME/.cache/matplotlib \
  ~/.venvs/marketing-econometrics/bin/python deck/make_figs_s2.py
Sources : results/03_model_comparison.csv, 04_model_comparison.csv, 06_deciles.csv, 06_calibration.csv,
06_shap_importance.csv, 06_robustesse_plis.csv + prédictions hors-échantillon (common.load_predictions).
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, roc_auc_score

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import common  # noqa: E402

OUT = Path(__file__).resolve().parent / 'figs'
OUT.mkdir(exist_ok=True)
RES = ROOT / 'results'

# palette du thème (theme.js)
DEEP, GREEN, LEAF, MINT, TINT = '#0E3B2B', '#1F7A4D', '#5DAA6F', '#D6E9DC', '#EFF6F1'
ORANGE, SLATE, SLATE2, INK, MUTED, GREY = '#F08A24', '#3F5F7F', '#9DB2C6', '#15201B', '#5F6B64', '#BDC6C0'
NB = ' '  # espace fine insécable (avant % et :)

plt.rcParams.update({
    'figure.dpi': 200, 'savefig.dpi': 200, 'figure.facecolor': 'white', 'axes.facecolor': 'white',
    'font.family': ['Arial', 'Helvetica', 'DejaVu Sans'], 'font.size': 11, 'text.color': INK,
    'axes.edgecolor': GREY, 'axes.labelcolor': MUTED, 'xtick.color': MUTED, 'ytick.color': MUTED,
    'axes.spines.top': False, 'axes.spines.right': False,
})


def f(x, d=4):
    """Nombre au format français (virgule)."""
    return f'{x:.{d}f}'.replace('.', ',')


def pc(x, d=1):
    return f'{x * 100:.{d}f}'.replace('.', ',') + NB + '%'


def save(fig, name):
    fig.savefig(OUT / name, bbox_inches='tight', pad_inches=0.04)
    plt.close(fig)
    print('écrit', OUT / name)


# ---------------------------------------------------------------- slide 6 : échelle de modèles
m3 = pd.read_csv(RES / '03_model_comparison.csv').set_index('model')
m4 = pd.read_csv(RES / '04_model_comparison.csv').set_index('model')
rows = [  # (étape, libellé, auc, écart-type entre plis)
    (1, 'Récence seule', m3.loc['recency_rule']),
    (1, 'Score RFM (cours)', m3.loc['rfm_score']),
    (2, 'Logistique Lasso', m3.loc['logreg_lasso']),
    (3, 'Arbre de décision', m3.loc['tree']),
    (3, 'k plus proches voisins', m3.loc['knn']),
    (3, 'Naive Bayes', m3.loc['nb']),
    (4, 'Forêt aléatoire réglée', m4.loc['rf_tuned']),
    (4, 'XGBoost réglé', m4.loc['xgb_tuned']),
    (4, 'LightGBM réglé', m4.loc['lgbm_tuned']),
]
step_lab = {1: 'Règles de référence', 2: 'Modèle linéaire', 3: 'Modèles simples du cours', 4: 'Forêt et boosting'}
step_col = {1: GREY, 2: GREEN, 3: LEAF, 4: DEEP}
auc_lasso = m3.loc['logreg_lasso', 'auc']
auc_lgbm = m4.loc['lgbm_tuned', 'auc']

fig, ax = plt.subplots(figsize=(7.9, 4.55))
n = len(rows)
# positions verticales : un petit espace entre deux étapes
ypos, y_cur, prev = [], float(n + 2), None
for s_, _, _ in rows:
    if prev is not None:
        y_cur -= 1.0 + (0.45 if s_ != prev else 0.0)
    ypos.append(y_cur)
    prev = s_
ypos = np.array(ypos)
ax.axvspan(auc_lasso, auc_lgbm, color=MINT, alpha=0.55, lw=0, zorder=0)
for (s, lab, r), y in zip(rows, ypos):
    ax.errorbar(r['auc'], y, xerr=r['auc_fold_std'], fmt='o', color=step_col[s], ecolor=step_col[s],
                elinewidth=1.6, capsize=3, ms=9, zorder=3)
    ax.text(r['auc'] + 0.0042, y, f(r['auc']), va='center', ha='left', fontsize=11, color=INK,
            fontweight='bold' if lab in ('Logistique Lasso', 'LightGBM réglé') else 'normal')
ax.set_yticks(ypos)
ax.set_yticklabels([lab for _, lab, _ in rows], fontsize=12, color=INK)
for t, (s, lab, _) in zip(ax.get_yticklabels(), rows):
    if lab in ('Logistique Lasso', 'LightGBM réglé'):
        t.set_fontweight('bold')
ax.set_xlim(0.805, 0.935)
ax.set_ylim(ypos.min() - 0.7, ypos.max() + 0.7)
ax.set_xticks([0.82, 0.84, 0.86, 0.88])
ax.set_xticklabels([f(v, 2) for v in [0.82, 0.84, 0.86, 0.88]], fontsize=11)
ax.set_xlabel('AUC hors-échantillon (validation croisée 5 plis) ; barre = ± 1 écart-type entre plis ; axe tronqué', fontsize=10)
ax.grid(axis='x', color='#E6ECE8', lw=0.8, zorder=0)
ax.set_axisbelow(True)
ax.spines['left'].set_visible(False)
ax.tick_params(axis='y', length=0)
# étiquettes des étapes (à droite, horizontales)
step_txt = {1: 'Règles de\nréférence', 2: 'Modèle\nlinéaire', 3: 'Modèles simples\ndu cours', 4: 'Forêt et\nboosting'}
for s_ in (1, 2, 3, 4):
    ys_s = [y for (ss, _, _), y in zip(rows, ypos) if ss == s_]
    ax.text(0.9345, np.mean(ys_s), f'{s_}  ' + step_txt[s_].replace('\n', '\n    '), va='center', ha='right', fontsize=10.5,
            color=(MUTED if s_ == 1 else step_col[s_]), fontweight='bold', clip_on=False)
for s_prev in (1, 2, 3):
    y_hi = min(y for (ss, _, _), y in zip(rows, ypos) if ss == s_prev)
    y_lo = max(y for (ss, _, _), y in zip(rows, ypos) if ss == s_prev + 1)
    ax.axhline((y_hi + y_lo) / 2, color=GREY, lw=0.8, ls=(0, (3, 3)), zorder=1)
# annotation du gain Lasso -> LightGBM
y_top = ypos.max() + 0.45
ax.text((auc_lasso + auc_lgbm) / 2, y_top, '+' + f(auc_lgbm - auc_lasso, 3), ha='center', va='bottom',
        fontsize=12.5, fontweight='bold', color=ORANGE)
save(fig, 's2_echelle_auc.png')

# ---------------------------------------------------------------- slide 7 : ROC, gain, déciles
y = common.load_target().sort_index()
oof_f, _ = common.load_predictions('final_lgbm')
oof_l, _ = common.load_predictions('logreg_lasso')
oof_r, _ = common.load_predictions('recency_rule')
idx = oof_f.index
y = y.loc[idx]
yv = y.values
base = yv.mean()


def gain_curve(score, tie='stable'):
    s = np.asarray(score.loc[idx])
    o = np.argsort(-s, kind='stable')
    cum = np.cumsum(yv[o]) / yv.sum()
    return np.arange(1, len(yv) + 1) / len(yv), cum


chk = common.topk_metrics(yv, oof_f.loc[idx].values)
assert abs(chk['recall'] - 0.5262265978050356) < 1e-9, chk
assert abs(roc_auc_score(yv, oof_f.loc[idx].values) - 0.8785470532630636) < 1e-9
print('contrôle top 10 % :', chk, ' base', base)

dec = pd.read_csv(RES / '06_deciles.csv')
fig, axs = plt.subplots(1, 3, figsize=(10.3, 3.0), gridspec_kw={'width_ratios': [1, 1, 1.15], 'wspace': 0.28})
# ROC
ax = axs[0]
for name, sc, col, lw, ls in [('LightGBM', oof_f, GREEN, 2.6, '-'), ('Lasso', oof_l, SLATE, 1.6, '-'), ('Récence seule', oof_r, GREY, 1.6, '-')]:
    fpr, tpr, _ = roc_curve(yv, sc.loc[idx].values)
    ax.plot(fpr, tpr, color=col, lw=lw, ls=ls, label=name, zorder=3 if name == 'LightGBM' else 2)
ax.plot([0, 1], [0, 1], color=MUTED, lw=1, ls=(0, (3, 3)))
ax.text(0.97, 0.06, 'AUC LightGBM ' + f(roc_auc_score(yv, oof_f.loc[idx].values)), ha='right', fontsize=10.5, color=GREEN, fontweight='bold')
ax.set_xlabel('Faux positifs (part des non-racheteurs)', fontsize=10)
ax.set_ylabel('Vrais positifs (part des racheteurs)', fontsize=10)
ax.set_title('Courbe ROC', fontsize=12, fontweight='bold', color=INK, loc='left')
ax.set_xlim(0, 1); ax.set_ylim(0, 1.0)
ax.legend(frameon=False, fontsize=9.5, loc='center right', bbox_to_anchor=(1.0, 0.42))
# Gain
ax = axs[1]
for name, sc, col, lw in [('LightGBM', oof_f, GREEN, 2.6), ('Lasso', oof_l, SLATE, 1.6), ('Récence seule', oof_r, GREY, 1.6)]:
    xg, cg = gain_curve(sc)
    ax.plot(xg, cg, color=col, lw=lw, zorder=3 if name == 'LightGBM' else 2)
ax.plot([0, 1], [0, 1], color=MUTED, lw=1, ls=(0, (3, 3)))
ax.axvline(0.10, color=ORANGE, lw=1.2, ls=(0, (2, 2)), zorder=1)
ax.scatter([0.10], [chk['recall']], color=ORANGE, s=60, zorder=5)
ax.annotate('10' + NB + '% ciblés\n' + pc(chk['recall']) + ' des racheteurs', xy=(0.10, chk['recall']), xytext=(0.36, 0.13),
            fontsize=10.5, color=INK, fontweight='bold', arrowprops=dict(arrowstyle='-', color=ORANGE, lw=1.2))
ax.text(0.40, 0.53, 'au hasard', fontsize=9.5, color=MUTED, rotation=40, ha='center')
ax.set_xlabel('Part des clients ciblés (classés par score)', fontsize=10)
ax.set_ylabel('Part des racheteurs captés', fontsize=10)
ax.set_title('Courbe de gain', fontsize=12, fontweight='bold', color=INK, loc='left')
ax.set_xlim(0, 1); ax.set_ylim(0, 1.0)
ax.set_xticks([0, .25, .5, .75, 1]); ax.set_xticklabels(['0', '25', '50', '75', '100'])
ax.set_yticks([0, .25, .5, .75, 1]); ax.set_yticklabels(['0', '25', '50', '75', '100'])
# Déciles (lift)
ax = axs[2]
cols = [ORANGE if d == 1 else GREEN for d in dec['decile']]
bars = ax.bar(dec['decile'], dec['taux_rachat'] * 100, color=cols, width=0.72, zorder=3)
ax.axhline(base * 100, color=MUTED, lw=1.2, ls=(0, (3, 3)), zorder=2)
ax.text(10.45, base * 100 + 1.0, 'base ' + pc(base), ha='right', fontsize=9.5, color=MUTED)
for d, r, l in zip(dec['decile'], dec['taux_rachat'] * 100, dec['lift']):
    if 2 <= d <= 3:
        ax.text(d + 0.05, r + 1.0, f(r, 1) + NB + '%', ha='center', fontsize=10, fontweight='bold', color=INK)
ax.text(1.55, 36.5, 'lift ' + f(dec['lift'].iloc[0], 2) + ' : 40,6' + NB + '% de rachat\ncontre 7,7' + NB + '% en moyenne', ha='left', va='center', fontsize=10.5, fontweight='bold', color=ORANGE)
ax.set_xticks(dec['decile'])
ax.set_xlabel('Décile de score (1 = les 10 % les mieux classés)', fontsize=10)
ax.set_ylabel('Taux de rachat (%)', fontsize=10)
ax.set_title('Taux de rachat par décile', fontsize=12, fontweight='bold', color=INK, loc='left')
ax.set_ylim(0, 52)
for a in axs:
    a.tick_params(labelsize=9.5)
    a.grid(axis='y', color='#E6ECE8', lw=0.7, zorder=0)
    a.set_axisbelow(True)
save(fig, 's2_roc_gain_deciles.png')

# ---------------------------------------------------------------- slide 8 : SHAP (importance moyenne absolue)
shap = pd.read_csv(RES / '06_shap_importance.csv', index_col=0)
top = shap.sort_values('part_importance', ascending=False).head(10)
top5_share = top['part_importance'].head(5).sum()
fig, ax = plt.subplots(figsize=(6.2, 5.0))
yy = np.arange(len(top))[::-1]
cols = [ORANGE if v == 'share_weekend' else GREEN for v in top.index]
ax.barh(yy, top['part_importance'] * 100, color=cols, height=0.66, zorder=3)
ax.set_yticks(yy)
ax.set_yticklabels(top['libelle'], fontsize=11.5, color=INK)
for yi, v, rho in zip(yy, top['part_importance'] * 100, top['sens_shap_rho']):
    arrow = '↑' if rho > 0 else '↓'
    ax.text(v + 0.25, yi, f(v, 1) + NB + '%  ', va='center', ha='left', fontsize=10.5, color=INK, fontweight='bold')
    ax.text(14.0, yi, arrow, va='center', ha='center', fontsize=14, color=GREEN if rho > 0 else SLATE, fontweight='bold')
ax.text(14.0, yy.max() + 0.85, 'si la valeur\nmonte', va='bottom', ha='center', fontsize=9, color=MUTED)
ax.set_xlim(0, 15)
ax.set_ylim(-0.6, yy.max() + 1.9)
ax.set_xticks([])
ax.spines['bottom'].set_visible(False); ax.spines['left'].set_visible(False)
ax.tick_params(axis='y', length=0)
ax.text(0, yy.max() + 1.15, 'Part de l’importance SHAP (moyenne de |SHAP|)', fontsize=10.5, color=MUTED, ha='left', va='bottom')
ax.text(9.2, yy[7], 'Les 5 premières variables\nportent ' + pc(top5_share, 0) + ' de l\u2019importance', fontsize=11, color=INK, fontweight='bold', va='center', ha='center',
        bbox=dict(boxstyle='round,pad=0.4', fc=TINT, ec=MINT))
save(fig, 's2_shap.png')

# ---------------------------------------------------------------- slide 9 : plis et calibration
rob = pd.read_csv(RES / '06_robustesse_plis.csv')
rp = rob.iloc[:5].copy()  # 5 plis (les lignes suivantes sont moyenne et écart-type)
fig, ax = plt.subplots(figsize=(3.3, 2.15))
xs = np.arange(5)
ax.plot(xs, rp['auc_final'].astype(float), 'o-', color=GREEN, lw=2.2, ms=7, label='LightGBM', zorder=3)
ax.plot(xs, rp['auc_lasso'].astype(float), 'o-', color=SLATE, lw=1.4, ms=5, label='Lasso', zorder=2)
ax.set_xticks(xs); ax.set_xticklabels(['1', '2', '3', '4', '5'], fontsize=10)
ax.set_xlabel('Pli de validation', fontsize=9.5)
ax.set_ylim(0.862, 0.886)
ax.set_yticks([0.865, 0.875, 0.885]); ax.set_yticklabels([f(v, 3) for v in [0.865, 0.875, 0.885]], fontsize=9.5)
ax.set_ylabel('AUC', fontsize=9.5)
ax.grid(axis='y', color='#E6ECE8', lw=0.7); ax.set_axisbelow(True)
ax.legend(frameon=False, fontsize=9, loc='lower center', ncol=2, bbox_to_anchor=(0.5, 1.0), handlelength=1.2, columnspacing=1.0)
save(fig, 's2_plis.png')

cal = pd.read_csv(RES / '06_calibration.csv')
fig, ax = plt.subplots(figsize=(3.3, 2.15))
mx = 0.58
ax.plot([0, mx], [0, mx], color=MUTED, lw=1, ls=(0, (3, 3)), zorder=1)
ax.scatter(cal['score'], cal['taux'], color=GREEN, s=26, zorder=3)
ax.set_xlim(0, mx); ax.set_ylim(0, mx)
ax.set_xticks([0, 0.2, 0.4]); ax.set_xticklabels(['0', '20', '40'], fontsize=9.5)
ax.set_yticks([0, 0.2, 0.4]); ax.set_yticklabels(['0', '20', '40'], fontsize=9.5)
ax.set_xlabel('Score moyen prédit (%)', fontsize=9.5)
ax.set_ylabel('Taux de rachat observé (%)', fontsize=9.5)
ax.text(0.55, 0.30, 'idéal', fontsize=9, color=MUTED, rotation=38, ha='center')
ax.grid(color='#E6ECE8', lw=0.7); ax.set_axisbelow(True)
save(fig, 's2_calibration.png')
