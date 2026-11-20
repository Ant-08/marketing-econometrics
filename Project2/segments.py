"""Segmentation du Projet 2 : règle RFM du cours (slides 23-28) et clustering comportemental (slides 31-47).

Tout est calculé à partir de la table de features du notebook 02 (`c.load_features`), donc avec
les seuls tickets antérieurs au 01/08/2020 : aucune information sur la cible.

Usage (notebook 07 par exemple) :
    import common as c, segments as sg
    Xtr, Xte = c.load_features('train'), c.load_features('test')
    seg_tr = sg.assign_rfm(Xtr)            # approche « seuils métier » (par défaut)
    seg_te = sg.assign_rfm(Xte)            # exactement la même règle sur le test
    th = sg.fit_thresholds(Xtr)            # approche « tertiles » : seuils appris sur le train seul
    seg_te_q = sg.assign_rfm(Xte, approach='quantiles', thresholds=th)

Définitions (R, F, M mesurés au 01/08/2020, sur 12 mois d'historique, achats uniquement, retours exclus) :
    R = `recency_days`   jours depuis le dernier ticket d'achat
    F = `n_tickets_all`  nombre de tickets d'achat sur 12 mois
    M = `spend_all`      montant dépensé sur 12 mois (€, paniers plafonnés au P99,9 par le notebook 02)
"""
import numpy as np
import pandas as pd

# ------------------------------------------------------------------ règles de la segmentation RFM
INACTIVE_DAYS = 180   # Inactive : aucun achat depuis plus de 180 jours (la moitié de l'historique observé)
NEW_DAYS = 90         # New : premier ticket observé il y a moins de 90 jours (historique trop court pour juger)

# Seuils métier (slide 27, « business-defined thresholds »). Haut / Moyen / Bas ; pour R, Haut = récent.
BUSINESS_THRESHOLDS = {
    'R': {'high_max_days': 14, 'medium_max_days': 60},      # ≤ 14 j : Haut ; 15-60 j : Moyen ; 61-180 j : Bas
    'F': {'low_max': 5, 'medium_max': 24},                  # ≤ 5 tickets/an : Bas ; 6-24 : Moyen ; ≥ 25 : Haut
    'M': {'low_max': 150.0, 'medium_max': 1000.0},          # ≤ 150 €/an : Bas ; 151-1000 € : Moyen ; > 1000 € : Haut
}

SEGMENT_ORDER = ['Top', 'Good', 'Decel', 'Small', 'Weak', 'New', 'Inactive']
# Regroupement des 9 cases RFM de la slide 25 en segments actionnables (slide 26)
CELL_TO_SEGMENT = {'9': 'Top', '8': 'Top', '6': 'Good', '5': 'Good', '3': 'Decel', '2': 'Decel',
                   '7': 'Small', '4': 'Small', '1': 'Weak', 'New': 'New', 'Inactive': 'Inactive'}
LEVELS = ['Low', 'Medium', 'High']


def scored_mask(df):
    """Clients que l'on note en R, F, M : ni Inactive, ni New."""
    return ~inactive_mask(df) & ~new_mask(df)


def inactive_mask(df):
    return (df['recency_days'] > INACTIVE_DAYS) | df['recency_days'].isna()   # NaN = que des retours, aucun achat


def new_mask(df):
    return (df['tenure_obs_days'] < NEW_DAYS) & ~inactive_mask(df)


def fit_thresholds(train_df):
    """Seuils par tertiles (slide 27, « data-driven »), appris sur le train et sur les clients notés (ni New, ni Inactive).

    Retourne un dict de même forme que BUSINESS_THRESHOLDS, plus la clé 'source'.
    """
    d = train_df.loc[scored_mask(train_df)]
    r33, r67 = d['recency_days'].quantile([1 / 3, 2 / 3])
    f33, f67 = d['n_tickets_all'].quantile([1 / 3, 2 / 3])
    m33, m67 = d['spend_all'].quantile([1 / 3, 2 / 3])
    return {'R': {'high_max_days': float(r33), 'medium_max_days': float(r67)},
            'F': {'low_max': float(f33), 'medium_max': float(f67)},
            'M': {'low_max': float(m33), 'medium_max': float(m67)},
            'source': 'tertiles du train, hors New et Inactive'}


def rfm_levels(df, approach='business', thresholds=None):
    """Niveaux Low/Medium/High de R, F et M (DataFrame, mêmes index). Pour R, High = récent."""
    th = BUSINESS_THRESHOLDS if approach == 'business' else thresholds
    if th is None:
        raise ValueError("approach='quantiles' demande `thresholds=fit_thresholds(train)`")
    r, f, m = df['recency_days'], df['n_tickets_all'], df['spend_all']
    rl = np.where(r <= th['R']['high_max_days'], 'High', np.where(r <= th['R']['medium_max_days'], 'Medium', 'Low'))
    fl = np.where(f <= th['F']['low_max'], 'Low', np.where(f <= th['F']['medium_max'], 'Medium', 'High'))
    ml = np.where(m <= th['M']['low_max'], 'Low', np.where(m <= th['M']['medium_max'], 'Medium', 'High'))
    return pd.DataFrame({'R': rl, 'F': fl, 'M': ml}, index=df.index)


def fm_level(f_level, m_level):
    """Grille FM de la slide 24 : 3 x 3 -> Low FM / Medium FM / High FM.

    Low FM    : (F bas, M bas), (F bas, M moyen), (F moyen, M bas)
    High FM   : (F moyen, M haut), (F haut, M moyen), (F haut, M haut)
    Medium FM : les trois autres cases, (F bas, M haut), (F moyen, M moyen), (F haut, M bas)
    """
    f, m = pd.Series(f_level), pd.Series(m_level)
    score = f.map({'Low': 0, 'Medium': 1, 'High': 2}) + m.map({'Low': 0, 'Medium': 1, 'High': 2})
    # somme 0-1 -> Low FM ; 2 -> Medium FM ; 3-4 -> High FM (équivalent à la grille de la slide 24)
    return pd.Series(np.where(score <= 1, 'Low', np.where(score == 2, 'Medium', 'High')), index=f.index)


def rfm_cell(df, approach='business', thresholds=None):
    """Numéro de case RFM de la slide 25 (1 à 9) pour les clients notés ; 'New' et 'Inactive' sinon.

    Ligne = niveau de récence (Low 1-3, Medium 4-6, High 7-9), colonne = Low / Medium / High FM.
    """
    lv = rfm_levels(df, approach, thresholds)
    fm = fm_level(lv['F'], lv['M'])
    row = lv['R'].map({'Low': 0, 'Medium': 1, 'High': 2})
    col = fm.map({'Low': 1, 'Medium': 2, 'High': 3})
    cell = (row * 3 + col).astype(int).astype(str)
    return cell.mask(new_mask(df), 'New').mask(inactive_mask(df), 'Inactive')


def assign_rfm(df, approach='business', thresholds=None):
    """Étiquette de segment actionnable (Top, Good, Decel, Small, Weak, New, Inactive) pour chaque client de `df`.

    Règles, dans cet ordre (slide 26 du cours, adaptée au supermarché) :
      1. Inactive : aucun achat depuis plus de 180 jours (ou aucun achat du tout, que des retours).
      2. New      : premier ticket observé il y a moins de 90 jours (historique trop court pour juger R, F et M).
      3. Sinon, FM = grille F x M de la slide 24 et R = niveau de récence :
           Top   = FM moyen ou haut et R haut     (cases 8, 9)
           Good  = FM moyen ou haut et R moyen    (cases 5, 6)
           Decel = FM moyen ou haut et R bas      (cases 2, 3)
           Small = FM bas et R haut ou moyen      (cases 4, 7)
           Weak  = FM bas et R bas                (case 1)
    `approach` : 'business' (seuils métier fixes, défaut) ou 'quantiles' (tertiles, `thresholds=fit_thresholds(train)`).
    Même fonction pour le train et le test : rien n'est appris sur `df` lui-même.
    """
    cell = rfm_cell(df, approach, thresholds)
    lab = cell.map(CELL_TO_SEGMENT)
    return pd.Series(pd.Categorical(lab, categories=SEGMENT_ORDER, ordered=True), index=df.index, name='rfm_segment')


# ------------------------------------------------------------------ clustering comportemental
# 9 variables de comportement d'achat (slide 38 : l'objectif de la segmentation choisit les variables ;
# le profil démographique ne sert qu'à interpréter). Une variable par « idée », peu redondantes.
CLUSTER_FEATURES = [
    ('log_recency', 'Récence (log du nombre de jours depuis le dernier achat)'),
    ('log_n_tickets_all', 'Fréquence (log du nombre de tickets sur 12 mois)'),
    ('trend_freq_90', 'Tendance de fréquence (90 derniers jours vs 90 précédents)'),
    ('log_basket_mean', 'Panier moyen (log, €)'),
    ('log_price_per_item', 'Prix moyen par article (log, €)'),
    ('discount_rate_all', 'Taux de remise global'),
    ('share_weekend', 'Part des tickets le week-end'),
    ('share_evening', 'Part des tickets en soirée (après 18 h)'),
    ('n_stores', 'Nombre de magasins fréquentés'),
]


def cluster_matrix(df):
    """Matrice des 9 variables de clustering (DataFrame, même index). Aucun appris sur les données : fonction pure.

    Les rares manquants (clients sans achat) sont laissés en NaN : l'imputation par la médiane du train se fait dans
    `fit_clusters` / `assign_clusters`.
    """
    out = pd.DataFrame(index=df.index)
    out['log_recency'] = np.log1p(df['recency_days'])
    out['log_n_tickets_all'] = np.log1p(df['n_tickets_all'])
    out['trend_freq_90'] = df['trend_freq_90']
    out['log_basket_mean'] = np.log1p(df['basket_mean_all'])
    out['log_price_per_item'] = np.log1p(df['price_per_item_mean'])
    out['discount_rate_all'] = df['discount_rate_all'].clip(lower=0)   # quelques remises négatives (régularisations) ramenées à 0
    out['share_weekend'] = df['share_weekend']
    out['share_evening'] = df['share_evening']
    out['n_stores'] = df['n_stores']
    return out[[n for n, _ in CLUSTER_FEATURES]]


def fit_clusters(train_df, k, n_components=None, variance=0.80, seed=42, n_init=10):
    """Ajuste standardisation + ACP + K-Means sur le train (K-Means sur les coordonnées factorielles, slide 36).

    Retourne un dict : median, scaler, pca, kmeans (classes numérotées 1..k par taille décroissante via `relabel`).
    """
    from sklearn.cluster import KMeans
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler
    Z = cluster_matrix(train_df)
    med = Z.median()
    scaler = StandardScaler().fit(Z.fillna(med))
    S = scaler.transform(Z.fillna(med))
    pca = PCA(random_state=seed).fit(S)
    if n_components is None:
        n_components = int(np.searchsorted(np.cumsum(pca.explained_variance_ratio_), variance) + 1)
    pca = PCA(n_components=n_components, random_state=seed).fit(S)
    P = pca.transform(S)
    km = KMeans(n_clusters=k, n_init=n_init, random_state=seed).fit(P)
    order = pd.Series(km.labels_).value_counts().index.tolist()          # 1 = classe la plus grosse
    relabel = {old: new + 1 for new, old in enumerate(order)}
    return {'median': med, 'scaler': scaler, 'pca': pca, 'kmeans': km, 'relabel': relabel}


def project(model, df):
    """Coordonnées factorielles d'un DataFrame de features avec les paramètres appris sur le train."""
    Z = cluster_matrix(df).fillna(model['median'])
    return model['pca'].transform(model['scaler'].transform(Z))


def assign_clusters(df, model):
    """Classe K-Means (1..k) de chaque client, avec les paramètres appris sur le train (même fonction pour le test)."""
    lab = model['kmeans'].predict(project(model, df))
    return pd.Series([model['relabel'][v] for v in lab], index=df.index, name='cluster')


def cluster_names(train_df, labels):
    """Noms lisibles des classes (k = 6), attribués par règle sur les moyennes du train : la classe la plus fréquente
    = Réguliers, la plus en hausse = Montants, etc. Au-delà de k = 6 ou en dessous : « C1 », « C2 »..."""
    Z = cluster_matrix(train_df).groupby(np.asarray(labels)).mean()
    if len(Z) != 6:
        return {i: f'C{i}' for i in Z.index}
    names, left = {}, list(Z.index)
    for nm, col in [('Réguliers', 'log_n_tickets_all'), ('Montants', 'trend_freq_90'), ('Week-end', 'share_weekend'),
                    ('Soirée', 'share_evening'), ('Paniers premium', 'log_basket_mean')]:
        i = Z.loc[left, col].idxmax()
        names[i] = f'C{i} {nm}'
        left.remove(i)
    names[left[0]] = f'C{left[0]} Petits paniers'
    return names
