"""Socle commun du Projet 2 : chemins, chargement, nettoyage, folds, métriques, sauvegardes.

Les règles de nettoyage sont justifiées dans `01_Data_Overview.ipynb`.
Les fichiers intermédiaires lourds vont dans WORK (hors de Google Drive), les résultats légers
(figures, tableaux, soumissions) restent dans le projet.
"""
from pathlib import Path
import json

import numpy as np
import pandas as pd

# ------------------------------------------------------------------ chemins
ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'Data'
FIG = ROOT / 'figures'
RES = ROOT / 'results'
SUB = ROOT / 'submissions'
WORK = Path.home() / '.cache' / 'marketing-econometrics' / 'project2'
for _d in (FIG, RES, SUB, WORK, WORK / 'preds'):
    _d.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ constantes
START_DATE = pd.Timestamp('2019-08-01')   # début de l'historique (heures UTC, comme les données)
REF_DATE = pd.Timestamp('2020-08-01')     # début du mois cible : tout ce qui précède est observable
SEED = 42
N_FOLDS = 5
TOP_FRAC = 0.10                           # contrainte métier : au plus 10 % de la base ciblée

# Palette (reprise du Projet 1)
ACCENT = '#eb6834'
BLUE = '#2a78d6'
GREY = '#bdbbb4'
INK = '#0b0b0b'
INK2 = '#52514e'
GREEN = '#1baf7a'
PURPLE = '#4a3aa7'


def set_style():
    import matplotlib.pyplot as plt
    plt.rcParams.update({
        'figure.facecolor': 'white', 'axes.facecolor': 'white', 'axes.edgecolor': '#d6d4cc',
        'axes.spines.top': False, 'axes.spines.right': False, 'axes.grid': False,
        'axes.titleweight': 'bold', 'axes.titlesize': 12, 'axes.labelcolor': INK2,
        'xtick.color': INK2, 'ytick.color': INK2, 'text.color': INK,
        'font.size': 10, 'figure.dpi': 110, 'savefig.dpi': 160, 'savefig.bbox': 'tight',
    })


# ------------------------------------------------------------------ chargement et nettoyage
_RAW_FILES = {'train': 'Train_transactions.csv', 'test': 'Test_transactions.csv'}


def load_raw(split):
    """Transactions brutes (une ligne du CSV = une ligne de ticket). Aucune transformation."""
    return pd.read_csv(DATA / _RAW_FILES[split], dtype=str).astype({
        'id_client': 'int64', 'stores_nb': 'int64', 'item_count': 'int64',
        'gross_amount': 'float64', 'discount_amount': 'float64', 'basket_value': 'float64',
        'payment_gift': 'int8', 'payment_cheque': 'int8', 'payment_cash': 'int8', 'payment_card': 'int8',
        'multicard': 'float64',
    })


def load_target():
    """Cible (repurchase = 1 si achat en août 2020) indexée par id_client, clients du train."""
    return pd.read_csv(DATA / 'Train_customers_repurchase.csv').set_index('id_client')['repurchase']


def _clean(raw):
    raw = raw.copy()
    # Horodatage en UTC naïf (même convention que le stagiaire qui a découpé août 2020).
    raw['ts'] = pd.to_datetime(raw['transaction_date'], utc=True).dt.tz_localize(None)

    # --- Attributs client : constants par client dans les données -> une ligne par client
    a = raw.groupby('id_client').agg(
        email_domain=('email_domain', 'first'), civility=('civility', 'first'),
        zip_raw=('zip_code', 'first'), card_raw=('card_subscription', 'first'),
        multicard=('multicard', 'first'))
    clients = pd.DataFrame(index=a.index)
    clients['email_domain'] = a['email_domain'].str.strip().str.upper()
    clients['has_email'] = clients['email_domain'].notna()
    clients['civility'] = a['civility'].fillna('ND')                    # M / MME / NR (non renseigné) / ND (absent)
    zip_s = a['zip_raw'].str.strip()
    foreign = zip_s.str.fullmatch(r'\d{4}', na=False)                   # 4 chiffres = codes suisses/belges (pas un zéro perdu)
    zip5 = zip_s.where(zip_s.str.fullmatch(r'\d{5}', na=False) & (zip_s != '00000'))   # '00000' = inconnu
    clients['zip5'] = zip5
    clients['dept'] = zip5.str[:2].mask(foreign, 'ETR')                  # ETR = adresse à l'étranger
    clients['card_date'] = pd.to_datetime(a['card_raw'], format='%d/%m/%Y', errors='coerce')
    clients['has_card'] = clients['card_date'].notna()                  # exclut la valeur texte corrompue
    clients['multicard'] = a['multicard'].where(a['multicard'].isin([0, 1]))   # une valeur 21 aberrante -> manquant
    clients['anonymous'] = a['civility'].isna() & a['multicard'].isna()  # profils sans fiche client

    # --- Tickets : plusieurs lignes pour un même (client, instant) = un seul ticket (paiement fractionné, lignes)
    raw['price_segmentation'] = raw['price_segmentation'].replace({'08': np.nan})   # modalité '08' : un seul client corrompu
    tickets = raw.groupby(['id_client', 'ts'], sort=True).agg(
        store=('stores_nb', 'first'), item_count=('item_count', 'sum'),
        gross_amount=('gross_amount', 'sum'), discount_amount=('discount_amount', 'sum'),
        basket_value=('basket_value', 'sum'),
        payment_gift=('payment_gift', 'max'), payment_cheque=('payment_cheque', 'max'),
        payment_cash=('payment_cash', 'max'), payment_card=('payment_card', 'max'),
        price_segmentation=('price_segmentation', 'first'), n_lines=('ts', 'size')).reset_index()
    tickets['store5'] = tickets['store'].astype(str).str.zfill(5)       # zéro initial perdu
    tickets['store_region'] = tickets['store5'].str[:2]                 # seuls les 2 premiers chiffres sont fiables
    tickets['is_return'] = tickets['basket_value'] <= 0                 # retours / avoirs
    return tickets, clients


def load_clean(split, force=False):
    """Retourne (tickets, clients) nettoyés, mis en cache dans WORK.

    tickets : une ligne par ticket (id_client, ts, store5, store_region, item_count, gross_amount,
              discount_amount, basket_value, payment_*, price_segmentation, n_lines, is_return)
    clients : une ligne par client (email_domain, has_email, civility, zip5, dept, has_card, card_date,
              multicard, anonymous)
    """
    pt, pc = WORK / f'tickets_{split}.parquet', WORK / f'clients_{split}.parquet'
    if force or not (pt.exists() and pc.exists()):
        tickets, clients = _clean(load_raw(split))
        tickets.to_parquet(pt)
        clients.to_parquet(pc)
    return pd.read_parquet(pt), pd.read_parquet(pc)


# ------------------------------------------------------------------ folds et features
def get_folds():
    """Numéro de fold (0..4) par client du train, fixé une fois pour toutes (stratifié sur la cible)."""
    p = WORK / 'folds.parquet'
    if not p.exists():
        from sklearn.model_selection import StratifiedKFold
        y = load_target().sort_index()
        f = pd.Series(-1, index=y.index, name='fold')
        for k, (_, va) in enumerate(StratifiedKFold(N_FOLDS, shuffle=True, random_state=SEED).split(y, y)):
            f.iloc[va] = k
        f.to_frame().to_parquet(p)
    return pd.read_parquet(p)['fold']


def save_features(split, df):
    """Table de features (index id_client). Produite par 02_Feature_Engineering.ipynb."""
    df.to_parquet(WORK / f'features_{split}.parquet')


def load_features(split):
    p = WORK / f'features_{split}.parquet'
    if not p.exists():
        raise FileNotFoundError('Features absentes : exécuter 02_Feature_Engineering.ipynb')
    return pd.read_parquet(p)


# ------------------------------------------------------------------ prédictions, soumissions, résultats
def save_predictions(name, oof, test):
    """oof : Series (index id_client du train, score hors-échantillon par CV) ; test : Series (index id_client du test)."""
    pd.concat([oof.rename('score').to_frame().assign(split='oof'),
               test.rename('score').to_frame().assign(split='test')]).to_parquet(WORK / 'preds' / f'{name}.parquet')


def load_predictions(name):
    d = pd.read_parquet(WORK / 'preds' / f'{name}.parquet')
    return d.loc[d['split'] == 'oof', 'score'], d.loc[d['split'] == 'test', 'score']


def write_submission(test_scores, name):
    """Fichier Kaggle : colonnes ID, Expected (séparateur virgule), un score par client du test."""
    ids = pd.read_csv(DATA / 'sampling_sample.csv')['ID']
    s = test_scores.reindex(ids)
    assert s.notna().all() and len(s) == len(ids), 'scores manquants pour certains clients du test'
    out = pd.DataFrame({'ID': ids.values, 'Expected': s.values})
    out.to_csv(SUB / f'{name}.csv', index=False)
    return SUB / f'{name}.csv'


def save_fig(fig, name):
    fig.savefig(FIG / f'{name}.png')
    return FIG / f'{name}.png'


def save_result(name, obj):
    """DataFrame -> results/name.csv ; dict/list -> results/name.json."""
    if isinstance(obj, (pd.DataFrame, pd.Series)):
        obj.to_csv(RES / f'{name}.csv')
    else:
        (RES / f'{name}.json').write_text(json.dumps(obj, indent=2, ensure_ascii=False, default=float))


# ------------------------------------------------------------------ métriques
def topk_metrics(y, score, frac=TOP_FRAC):
    """Précision, rappel et lift quand on cible les `frac` meilleurs scores (contrainte des 10 %)."""
    y = np.asarray(y)
    score = np.asarray(score)
    k = int(round(len(y) * frac))
    top = np.argsort(-score, kind='stable')[:k]
    prec = y[top].mean()
    return {'k': k, 'precision': prec, 'recall': y[top].sum() / y.sum(), 'lift': prec / y.mean()}


def cv_report(y, oof, folds):
    """AUC global et par fold, log-loss, précision/rappel/lift dans le top 10 % (sur les prédictions hors-échantillon)."""
    from sklearn.metrics import roc_auc_score, log_loss
    y = y.loc[oof.index]
    per_fold = [roc_auc_score(y[folds.loc[oof.index] == k], oof[folds.loc[oof.index] == k]) for k in range(N_FOLDS)]
    top = topk_metrics(y.values, oof.values)
    return {'auc': roc_auc_score(y, oof), 'auc_fold_mean': float(np.mean(per_fold)),
            'auc_fold_std': float(np.std(per_fold)),
            'logloss': log_loss(y, np.clip(oof, 1e-6, 1 - 1e-6)),
            'precision_top10': top['precision'], 'recall_top10': top['recall'], 'lift_top10': top['lift']}
