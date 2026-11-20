"""Feature engineering du Projet 2 : une ligne par client, calculée à la date de référence `ref_date`.

`build_features` est LA fonction commune au train et au test : elle ne regarde que les tickets
antérieurs à `ref_date` et n'utilise jamais la cible. Tout ce qui s'apprend sur des données
(plafonds des valeurs extrêmes, regroupement des modalités rares, choix des variables à transformer
en log) est isolé dans `fit_preprocessing` (appelé sur le train uniquement) puis appliqué à
l'identique au train et au test par `apply_preprocessing`.

Conventions de la table produite :
  - index `id_client`, une ligne par client de `clients` ;
  - `num` : float (NaN = non défini, voir la colonne `na` de FEATURE_SPEC), `bin` : entier 0/1,
    `cat` : chaîne de caractères (le manquant est une modalité à part : 'ND', 'INCONNU', 'SANS_EMAIL', 'ETR').
"""
import numpy as np
import pandas as pd

import common as c

WINDOWS = (7, 14, 30, 60, 90, 180)           # fenêtres de récence/fréquence (jours avant ref_date)
LOCKDOWN = (pd.Timestamp('2020-03-17'), pd.Timestamp('2020-05-11'))   # 1er confinement en France
SEGMENTS = ('Access', 'Mixte', 'Quali', 'xx', 'INCONNU')              # le manquant est une modalité à part ; '8' est déjà traité par common.py

# Domaines d'e-mail : le cours cite l'e-mail comme proxy d'âge (anciens FAI vs webmails récents).
_FAI = {'ORANGE.FR', 'WANADOO.FR', 'FREE.FR', 'LAPOSTE.NET', 'LAPOSTE.FR', 'SFR.FR', 'NEUF.FR', 'BBOX.FR',
        'ALICEADSL.FR', 'CLUB-INTERNET.FR', 'VOILA.FR', 'NUMERICABLE.FR', 'NUMERICABLE.COM', 'CEGETEL.NET',
        'NOOS.FR', 'TELE2.FR', 'TISCALI.FR', '9ONLINE.FR', 'INFONIE.FR', 'LIBERTYSURF.FR', 'ORANGE.COM',
        'NORDNET.FR', 'AKEONET.COM'}
_WEBMAIL_PREFIX = ('GMAIL.', 'GOOGLEMAIL.', 'HOTMAIL.', 'YAHOO.', 'YMAIL.', 'LIVE.', 'OUTLOOK.', 'MSN.', 'AOL.',
                   'ICLOUD.', 'ME.COM', 'MAC.COM', 'GMX.', 'MAIL.', 'YOPMAIL.')


def _s(name, type_, group, description, rationale, cap=None, na=''):
    return dict(name=name, type=type_, group=group, description=description, rationale=rationale, cap=cap, na=na)


_R, _F, _M, _T, _S_, _P, _PAY, _SEG, _ST, _PRO = ('Récence', 'Fréquence', 'Montant', 'Rythme et tendance', 'Saisonnalité',
                                                 'Promotions et retours', 'Paiement', 'Segment de prix', 'Magasins',
                                                 'Profil client')
_NA_ONE = 'NaN si moins de 2 tickets (intervalle non défini)'
_NA_THREE = 'NaN si moins de 3 tickets'
_NA_ZERO = 'NaN si aucun ticket dans la fenêtre'

FEATURE_SPEC = [
    # ---------------------------------------------------------------- Récence
    _s('recency_days', 'num', _R, 'Jours entre le dernier ticket d\'achat et la date de référence',
       'Variable la plus classique du scoring : un client qui vient d\'acheter rachète plus vite', na='NaN si aucun achat (10 clients)'),
    _s('recency_prev_days', 'num', _R, 'Jours entre l\'avant-dernier ticket et la date de référence',
       'Donne la forme de la fin d\'historique (deux visites récentes = client installé)', na=_NA_ONE),
    _s('last_interval_days', 'num', _R, 'Jours entre l\'avant-dernier et le dernier ticket',
       'Dernier écart d\'achat : un client dont les visites se rapprochent est actif', na=_NA_ONE),
    _s('tenure_obs_days', 'num', _R, 'Jours depuis le premier ticket observé (ancienneté dans la fenêtre de 12 mois)',
       'Distingue les nouveaux clients (peu d\'historique) des clients installés ; borné à 366 jours car l\'historique est tronqué',
       na='NaN si aucun achat'),
    # ---------------------------------------------------------------- Fréquence
    *[_s(f'n_tickets_{w}', 'num', _F, f'Nombre de tickets d\'achat sur les {w} derniers jours',
         'Fréquence récente : plus la fenêtre est courte, plus elle capte l\'activité du moment', cap='up') for w in WINDOWS],
    _s('n_tickets_all', 'num', _F, 'Nombre de tickets d\'achat sur tout l\'historique (366 jours)',
       'Fréquence de long terme : le meilleur résumé du « niveau de fidélité » (365 jours ≈ tout l\'historique)', cap='up'),
    _s('n_active_days', 'num', _F, 'Nombre de jours calendaires avec au moins un ticket',
       'Compte les visites plutôt que les tickets (plusieurs tickets le même jour = une seule visite)', cap='up'),
    _s('n_active_weeks', 'num', _F, 'Nombre de semaines distinctes avec au moins un achat',
       'Mesure la régularité hebdomadaire des courses', cap='up'),
    _s('n_active_months', 'num', _F, 'Nombre de mois calendaires distincts avec au moins un achat (sur 12)',
       'Un client présent chaque mois est plus susceptible de l\'être en août', cap='up'),
    _s('max_tickets_per_day', 'num', _F, 'Nombre maximal de tickets le même jour',
       'Repère les comportements de « courses fractionnées » ou de comptes collectifs', cap='up'),
    _s('tickets_per_active_day', 'num', _F, 'Tickets par jour actif (n_tickets_all / n_active_days)',
       'Intensité de la visite : 1 = un passage en caisse par visite', cap='up'),
    _s('active_weeks_share', 'num', _F, 'Part des semaines actives depuis le premier achat',
       'Régularité relative à l\'ancienneté (un nouveau client très actif n\'est pas pénalisé)', na='NaN si aucun achat'),
    # ---------------------------------------------------------------- Montant
    *[_s(f'spend_{w}', 'num', _M, f'Somme des paniers d\'achat sur les {w} derniers jours (€)',
         'Valeur récente du client (le « M » de RFM)', cap='up') for w in (30, 60, 90, 180)],
    _s('spend_all', 'num', _M, 'Somme des paniers d\'achat sur tout l\'historique (€)',
       'Valeur de long terme du client (le « M » de RFM)', cap='up'),
    *[_s(f'basket_mean_{w}', 'num', _M, f'Panier moyen (€) sur les {w} derniers jours',
         'Montant moyen par passage : capte le type de course (appoint ou gros panier)', cap='up', na=_NA_ZERO) for w in (30, 90, 180)],
    _s('basket_mean_all', 'num', _M, 'Panier moyen (€) sur tout l\'historique', 'Type de course habituel', cap='up'),
    _s('basket_median_all', 'num', _M, 'Panier médian (€)', 'Version robuste du panier moyen (peu sensible aux gros achats isolés)', cap='up'),
    _s('basket_max_all', 'num', _M, 'Plus gros panier (€)', 'Capte les achats exceptionnels (fêtes, stocks)', cap='up'),
    _s('basket_std_all', 'num', _M, 'Écart-type des paniers (€)', 'Variabilité des dépenses : appoint régulier vs courses mixtes', cap='up', na='NaN si moins de 2 tickets'),
    _s('items_30', 'num', _M, 'Nombre d\'articles achetés sur les 30 derniers jours', 'Volume récent (en articles)', cap='up'),
    _s('items_90', 'num', _M, 'Nombre d\'articles achetés sur les 90 derniers jours', 'Volume récent (en articles)', cap='up'),
    _s('items_all', 'num', _M, 'Nombre d\'articles achetés sur tout l\'historique', 'Volume de long terme (en articles)', cap='up'),
    _s('items_per_ticket_mean', 'num', _M, 'Articles par ticket (moyenne)', 'Taille du panier en nombre d\'articles (appoint vs courses)', cap='up'),
    _s('price_per_item_mean', 'num', _M, 'Dépense moyenne par article (€)', 'Niveau de gamme (articles chers ou bon marché)', cap='up', na='NaN si aucun article'),
    # ---------------------------------------------------------------- Rythme et tendance
    _s('interval_mean_days', 'num', _T, 'Intervalle moyen entre deux tickets (jours)', 'Rythme d\'achat habituel du client', cap='up', na=_NA_ONE),
    _s('interval_median_days', 'num', _T, 'Intervalle médian entre deux tickets (jours)', 'Rythme habituel, robuste aux longues absences', cap='up', na=_NA_ONE),
    _s('interval_std_days', 'num', _T, 'Écart-type des intervalles (jours)', 'Irrégularité du rythme', cap='up', na=_NA_THREE),
    _s('interval_min_days', 'num', _T, 'Plus petit intervalle (jours)', 'Repère les achats groupés (0 = deux tickets le même jour)', cap='up', na=_NA_ONE),
    _s('interval_max_days', 'num', _T, 'Plus long intervalle (jours)', 'Plus longue absence observée : un client qui s\'absente 3 mois est « volatil »', cap='up', na=_NA_ONE),
    _s('interval_cv', 'num', _T, 'Coefficient de variation des intervalles (écart-type / moyenne)', 'Régularité : proche de 0 = métronome', cap='up', na=_NA_THREE),
    _s('delay_ratio_mean', 'num', _T, 'Retard relatif : récence / max(intervalle moyen, 1 jour)', 'Un client « en retard » sur son rythme est peut-être parti ; « à l\'heure » il va revenir', cap='up', na=_NA_ONE),
    _s('delay_ratio_median', 'num', _T, 'Retard relatif : récence / max(intervalle médian, 1 jour)', 'Variante robuste du retard relatif', cap='up', na=_NA_ONE),
    _s('delay_z', 'num', _T, 'Écart standardisé au rythme : (récence − intervalle moyen) / max(écart-type, 1 jour)', 'Retard exprimé en « écarts habituels » (écart à la moyenne, slide 85)', cap='both', na=_NA_THREE),
    _s('last_interval_ratio', 'num', _T, 'Dernier intervalle / intervalle moyen', 'Le rythme s\'accélère-t-il (< 1) ou ralentit-il (> 1) ?', cap='up', na=_NA_ONE),
    _s('is_one_shot', 'bin', _T, 'Client avec au plus un ticket d\'achat', 'Indicateur du manquant structurel des variables de rythme ; ces clients rachètent très peu', na=''),
    _s('has_interval_std', 'bin', _T, 'Client avec au moins 3 tickets (écart-type des intervalles défini)', 'Indicateur du manquant structurel des variables de dispersion', na=''),
    _s('is_new_90', 'bin', _T, 'Premier achat observé il y a moins de 90 jours', 'Nouveau client : comportement différent des clients installés', na=''),
    _s('trend_freq_90', 'num', _T, 'Tendance de fréquence : log[(tickets 90 derniers j + 1) / (tickets des 90 j précédents + 1)]', 'Montée ou chute récente de l\'activité (« décélération », slide 27)', cap='both'),
    _s('trend_spend_90', 'num', _T, 'Tendance de dépense : log[(dépense 90 derniers j + 1) / (dépense des 90 j précédents + 1)]', 'Même idée en montants', cap='both'),
    _s('freq_30_vs_rate', 'num', _T, 'Tickets des 30 derniers jours / rythme mensuel moyen du client', 'Le dernier mois est-il plus actif que d\'habitude ?', cap='up', na='NaN si aucun achat'),
    _s('basket_90_vs_hist', 'num', _T, 'Panier moyen des 90 derniers jours / panier moyen de l\'historique', 'Évolution du montant par visite', cap='up', na=_NA_ZERO),
    # ---------------------------------------------------------------- Saisonnalité
    _s('bought_same_month_ly', 'bin', _S_, 'A acheté en août 2019 (même mois que la cible, l\'an passé)', 'Effet saisonnier direct (slide 50) : un client déjà présent en août l\'est probablement encore', na=''),
    _s('n_tickets_same_month_ly', 'num', _S_, 'Nombre de tickets en août 2019', 'Intensité d\'achat au même mois l\'an passé', cap='up'),
    _s('spend_same_month_ly', 'num', _S_, 'Dépense en août 2019 (€)', 'Valeur au même mois l\'an passé', cap='up'),
    _s('share_july', 'num', _S_, 'Part des tickets réalisés en juillet 2020', 'Mois qui précède la cible : client en pleine activité estivale', na='NaN si aucun achat'),
    _s('share_summer_months', 'num', _S_, 'Part des tickets en juillet et août (vacances d\'été)', 'Client plutôt « estival » ou qui part en vacances', na='NaN si aucun achat'),
    _s('share_xmas', 'num', _S_, 'Part des tickets du 20 décembre au 4 janvier', 'Achats de fêtes : client occasionnel de fin d\'année', na='NaN si aucun achat'),
    _s('share_lockdown', 'num', _S_, 'Part des tickets pendant le 1er confinement (17 mars - 10 mai 2020)', 'Réaction au creux d\'activité de mars-avril 2020 (proximité vs autres lieux)', na='NaN si aucun achat'),
    _s('share_weekend', 'num', _S_, 'Part des tickets le samedi ou le dimanche', 'Jour de course habituel (extraction de la date, slide 85)', na='NaN si aucun achat'),
    _s('share_saturday', 'num', _S_, 'Part des tickets le samedi', 'Le samedi est le gros jour de courses', na='NaN si aucun achat'),
    _s('share_evening', 'num', _S_, 'Part des tickets à partir de 18 h', 'Courses après le travail (actif) vs journée (retraité, temps partiel)', na='NaN si aucun achat'),
    _s('share_morning', 'num', _S_, 'Part des tickets avant 12 h', 'Courses du matin : profil plus âgé ou disponible', na='NaN si aucun achat'),
    # ---------------------------------------------------------------- Promotions et retours
    _s('discount_rate_all', 'num', _P, 'Taux de remise global : remises / montant brut', 'Sensibilité aux promotions (levier de l\'e-mail promo)', cap='up', na='NaN si aucun achat'),
    _s('discount_rate_90', 'num', _P, 'Taux de remise sur les 90 derniers jours', 'Sensibilité récente aux promotions', cap='up', na=_NA_ZERO),
    _s('discount_rate_max', 'num', _P, 'Taux de remise maximal sur un ticket', 'Capte les gros coups de promotion', cap='up', na='NaN si aucun achat'),
    _s('share_tickets_disc', 'num', _P, 'Part des tickets avec remise', 'Fréquence de recours aux promotions', na='NaN si aucun achat'),
    _s('n_tickets_disc', 'num', _P, 'Nombre de tickets avec remise', 'Volume d\'achats promotionnels', cap='up'),
    _s('basket_mean_disc', 'num', _P, 'Panier moyen des tickets avec remise (€)', 'Le client dépense-t-il plus quand il y a une promotion ?', cap='up', na='NaN si aucun ticket remisé'),
    _s('basket_mean_nodisc', 'num', _P, 'Panier moyen des tickets sans remise (€)', 'Dépense hors promotion', cap='up', na='NaN si aucun ticket non remisé'),
    _s('n_returns', 'num', _P, 'Nombre de tickets de retour (panier ≤ 0)', 'Retours/avoirs : signe d\'insatisfaction ou de gros achats', cap='up'),
    _s('share_returns', 'num', _P, 'Part des tickets qui sont des retours', 'Intensité relative des retours', na=''),
    _s('return_amount', 'num', _P, 'Montant total des retours (€, en valeur absolue)', 'Valeur des retours', cap='up'),
    # ---------------------------------------------------------------- Paiement
    _s('share_pay_card', 'num', _PAY, 'Part des tickets payés (en partie) par carte', 'Mode de paiement dominant (indice de profil et de montant)', na='NaN si aucun achat'),
    _s('share_pay_cash', 'num', _PAY, 'Part des tickets payés (en partie) en espèces', 'Les clients en espèces sont plus anonymes, souvent petits paniers', na='NaN si aucun achat'),
    _s('share_pay_cheque', 'num', _PAY, 'Part des tickets payés (en partie) par chèque', 'Profil plus âgé', na='NaN si aucun achat'),
    _s('share_pay_gift', 'num', _PAY, 'Part des tickets payés (en partie) par cartes cadeaux', 'Client qui reçoit des cadeaux de l\'enseigne (comité d\'entreprise, offres)', na='NaN si aucun achat'),
    _s('share_pay_mixed', 'num', _PAY, 'Part des tickets avec au moins deux modes de paiement', 'Paiement fractionné', na='NaN si aucun achat'),
    _s('share_pay_none', 'num', _PAY, 'Part des tickets sans mode de paiement renseigné', 'Capte des tickets atypiques (règlement différé, avoir)', na='NaN si aucun achat'),
    # ---------------------------------------------------------------- Segment de prix
    _s('price_segment', 'cat', _SEG, 'Segment de prix du client : Access, Mixte, Quali, xx ou INCONNU (absent)',
       'Gamme habituelle du client (abordable, intermédiaire, haut de gamme) ; une seule modalité par client dans les données ; le manquant est gardé comme modalité à part (INCONNU)', na='INCONNU si absent'),
    _s('price_segment_missing', 'bin', _SEG, 'Segment de prix absent', 'Indicateur explicite du manquant (plus de la moitié des clients) : l\'absence est elle-même liée au rachat', na=''),
    # ---------------------------------------------------------------- Magasins
    _s('n_stores', 'num', _ST, 'Nombre de magasins distincts fréquentés', 'Client multi-sites (mobile) vs attaché à un magasin', cap='up'),
    _s('n_regions', 'num', _ST, 'Nombre de régions (2 premiers chiffres) distinctes', 'Mobilité géographique (vacances, travail)', cap='up'),
    _s('main_store_share', 'num', _ST, 'Part des tickets dans le magasin principal', 'Fidélité à un magasin', na='NaN si aucun achat'),
    _s('last_store_is_main', 'bin', _ST, 'Le dernier ticket est dans le magasin principal', 'Un dernier achat « ailleurs » signale une visite occasionnelle (vacances)', na=''),
    _s('main_store_region', 'cat', _ST, 'Région du magasin principal (2 premiers chiffres du code magasin ; modalités rares regroupées)', 'Zone géographique : contexte local et saisonnalité (littoral en août)', na='INCONNU si aucun achat'),
    _s('main_store_outside_home_dept', 'bin', _ST, 'Magasin principal hors du département du domicile', 'Client de passage ou travaillant ailleurs ; 0 si le domicile est inconnu', na=''),
    _s('main_store_client_share', 'num', _ST, 'Part (en %) des clients de la base qui fréquentent le magasin principal', 'Taille/fréquentation du magasin, relative à la taille de l\'échantillon (comparable train/test)', na='NaN si aucun achat'),
    # ---------------------------------------------------------------- Profil client
    _s('civility', 'cat', _PRO, 'Civilité : M, MME, NR (non renseigné), ND (absent = profil anonyme)', 'Profil socio-démographique de base', na=''),
    _s('has_email', 'bin', _PRO, 'E-mail renseigné', 'Canal joignable : 45 % de la base n\'est pas joignable par e-mail', na=''),
    _s('email_domain', 'cat', _PRO, 'Domaine de l\'e-mail (domaines fréquents, AUTRE, SANS_EMAIL)', 'Proxy d\'âge et de profil (le cours cite l\'e-mail comme proxy d\'âge)', na='SANS_EMAIL si absent'),
    _s('email_type', 'cat', _PRO, 'Type de domaine : FAI (orange, free…), WEBMAIL (gmail, hotmail…), PRO_AUTRE, SANS_EMAIL', 'Version plus robuste du domaine : anciens FAI vs webmails récents vs adresses professionnelles', na='SANS_EMAIL si absent'),
    _s('dept', 'cat', _PRO, 'Département du domicile (modalités rares regroupées ; ETR = code postal étranger ; INCONNU si code postal absent ou invalide)', 'Zone d\'habitation (urbain/littoral, distance au magasin)', na='INCONNU si absent'),
    _s('dept_missing', 'bin', _PRO, 'Code postal du domicile absent ou invalide', 'Indicateur explicite du manquant', na=''),
    _s('has_card', 'bin', _PRO, 'Carte de fidélité souscrite', 'Engagement envers l\'enseigne (3 % de la base seulement)', na=''),
    _s('card_tenure_days', 'num', _PRO, 'Ancienneté de la carte de fidélité (jours)', 'Un client fidèle de longue date rachète plus', cap='up', na='NaN sans carte ou date invalide'),
    _s('card_joined_in_window', 'bin', _PRO, 'Carte souscrite pendant les 12 mois observés', 'Adhésion récente : phase de forte activité', na=''),
    _s('multicard', 'bin', _PRO, 'Adhère à d\'autres programmes de fidélité (manquant = 0, voir anonymous)', 'Client « chasseur de promotions »', na='0 si absent (voir anonymous)'),
    _s('anonymous', 'bin', _PRO, 'Profil anonyme (civilité et multicard absents)', 'Clients sans fiche : taux de rachat quasi nul, à isoler', na=''),
]

SPEC = pd.DataFrame(FEATURE_SPEC).set_index('name')
FEATURE_NAMES = list(SPEC.index)
CAT_COLS = list(SPEC.index[SPEC['type'] == 'cat'])
CAP_COLS = {n: r for n, r in SPEC['cap'].items() if isinstance(r, str)}            # 'up' (plafond haut) ou 'both' (bas et haut)
RARE_RULES = {'email_domain': (100, ['SANS_EMAIL']), 'dept': (0.01, ['INCONNU', 'ETR']),
              'main_store_region': (0.01, ['INCONNU'])}             # (part minimale de clients, modalités toujours gardées)
CAP_Q = 0.999                                                       # percentile de plafonnement (appris sur le train)
TICKET_CAP_Q = 0.999                                                # plafond des tickets (panier, articles), appris sur le train
SKEW_LOG = 3.0                                                      # asymétrie au-delà de laquelle on ajoute un jumeau log
LOG_PREFIX = 'log_'


def _email_type(dom):
    out = pd.Series('PRO_AUTRE', index=dom.index, dtype='object')
    out[dom.isin(_FAI)] = 'FAI'
    out[dom.fillna('').str.startswith(_WEBMAIL_PREFIX)] = 'WEBMAIL'
    out[dom.isna()] = 'SANS_EMAIL'
    return out


def _reindexed(s, idx, fill=np.nan):
    return s.reindex(idx) if fill is np.nan else s.reindex(idx, fill_value=fill)


def fit_ticket_caps(tickets, q=TICKET_CAP_Q):
    """Plafonds au niveau ticket (panier et nombre d'articles), appris sur les tickets d'achat du TRAIN."""
    P = tickets.loc[~tickets['is_return']]
    return {col: float(P[col].quantile(q)) for col in ('basket_value', 'item_count')}


def build_features(tickets, clients, ref_date=c.REF_DATE, ticket_caps=None):
    """Table de features client (index id_client) observable à `ref_date`. Même fonction pour train et test.

    tickets : sortie de `c.load_clean(...)[0]` ; clients : sortie de `c.load_clean(...)[1]`.
    Seuls les tickets antérieurs à `ref_date` sont utilisés ; aucun usage de la cible.
    ticket_caps : plafonds du panier et du nombre d'articles par ticket (`fit_ticket_caps`, appris sur le train) ;
    appliqués avant d'agréger par client. Les mêmes valeurs doivent servir pour le train et le test.
    """
    ref = pd.Timestamp(ref_date)
    idx = clients.index
    t = tickets.loc[(tickets['ts'] < ref) & tickets['id_client'].isin(idx)].sort_values(['id_client', 'ts'], kind='stable')
    t = t.assign(age=(ref - t['ts']).dt.total_seconds() / 86400.0)     # jours avant ref_date
    ret = t.loc[t['is_return']]
    P = t.loc[~t['is_return']].copy()                                    # tickets d'achat (panier > 0)
    if ticket_caps:
        for col, hi in ticket_caps.items():
            P[col] = P[col].clip(upper=hi)
    f = {}

    g = P.groupby('id_client')
    n_all = _reindexed(g.size(), idx, 0).astype(float)
    last_age = np.floor(_reindexed(g['age'].min(), idx))              # jours révolus
    first_age = np.floor(_reindexed(g['age'].max(), idx))

    # ------------------------------------------------ Récence
    P['rk_end'] = g.cumcount(ascending=False)
    prev_age = _reindexed(P.loc[P['rk_end'] == 1].set_index('id_client')['age'], idx).pipe(np.floor)
    f['recency_days'] = last_age
    f['recency_prev_days'] = prev_age
    f['last_interval_days'] = prev_age - last_age
    f['tenure_obs_days'] = first_age

    # ------------------------------------------------ Fenêtres : fréquence et montant
    n_w, sp_w, it_w = {}, {}, {}
    for w in WINDOWS:
        sub = P.loc[P['age'] <= w]
        gs = sub.groupby('id_client')
        n_w[w] = _reindexed(gs.size(), idx, 0).astype(float)
        sp_w[w] = _reindexed(gs['basket_value'].sum(), idx, 0.0)
        it_w[w] = _reindexed(gs['item_count'].sum(), idx, 0).astype(float)
        f[f'n_tickets_{w}'] = n_w[w]
    f['n_tickets_all'] = n_all
    spend_all = _reindexed(g['basket_value'].sum(), idx, 0.0)
    items_all = _reindexed(g['item_count'].sum(), idx, 0).astype(float)

    P['d'] = P['ts'].dt.normalize()
    g = P.groupby('id_client')
    n_days = _reindexed(g['d'].nunique(), idx, 0).astype(float)
    P['wk'] = (P['age'] // 7).astype(int)
    P['mo'] = P['ts'].dt.year * 12 + P['ts'].dt.month
    f['n_active_days'] = n_days
    f['n_active_weeks'] = _reindexed(P.groupby('id_client')['wk'].nunique(), idx, 0).astype(float)
    f['n_active_months'] = _reindexed(P.groupby('id_client')['mo'].nunique(), idx, 0).astype(float)
    f['max_tickets_per_day'] = _reindexed(P.groupby(['id_client', 'd']).size().groupby('id_client').max(), idx, 0).astype(float)
    f['tickets_per_active_day'] = n_all / n_days.where(n_days > 0)
    f['active_weeks_share'] = f['n_active_weeks'] / (first_age // 7 + 1)

    for w in (30, 60, 90, 180):
        f[f'spend_{w}'] = sp_w[w]
    f['spend_all'] = spend_all
    for w in (30, 90, 180):
        f[f'basket_mean_{w}'] = sp_w[w] / n_w[w].where(n_w[w] > 0)
    f['basket_mean_all'] = spend_all / n_all.where(n_all > 0)
    f['basket_median_all'] = _reindexed(g['basket_value'].median(), idx)
    f['basket_max_all'] = _reindexed(g['basket_value'].max(), idx)
    f['basket_std_all'] = _reindexed(g['basket_value'].std(), idx)
    f['items_30'], f['items_90'], f['items_all'] = it_w[30], it_w[90], items_all
    f['items_per_ticket_mean'] = items_all / n_all.where(n_all > 0)
    f['price_per_item_mean'] = spend_all / items_all.where(items_all > 0)

    # ------------------------------------------------ Rythme et tendance
    P['gap'] = np.floor(P.groupby('id_client')['ts'].diff().dt.total_seconds() / 86400.0)   # jours révolus
    g = P.groupby('id_client')
    gg = P.groupby('id_client')['gap']
    i_mean, i_std = _reindexed(gg.mean(), idx), _reindexed(gg.std(), idx)
    i_med = _reindexed(gg.median(), idx)
    f['interval_mean_days'], f['interval_median_days'], f['interval_std_days'] = i_mean, i_med, i_std
    f['interval_min_days'], f['interval_max_days'] = _reindexed(gg.min(), idx), _reindexed(gg.max(), idx)
    f['interval_cv'] = i_std / i_mean.where(i_mean > 0)
    f['delay_ratio_mean'] = last_age / i_mean.clip(lower=1.0)
    f['delay_ratio_median'] = last_age / i_med.clip(lower=1.0)
    f['delay_z'] = (last_age - i_mean) / i_std.clip(lower=1.0)
    f['last_interval_ratio'] = f['last_interval_days'] / i_mean.clip(lower=1.0)
    f['is_one_shot'] = (n_all <= 1).astype('int8')
    f['has_interval_std'] = (n_all >= 3).astype('int8')
    f['is_new_90'] = (first_age <= 90).astype('int8')
    f['trend_freq_90'] = np.log((n_w[90] + 1) / (n_w[180] - n_w[90] + 1))
    f['trend_spend_90'] = np.log1p(sp_w[90].clip(lower=0)) - np.log1p((sp_w[180] - sp_w[90]).clip(lower=0))
    rate = n_all / (first_age / 30.44).clip(lower=1.0)                   # tickets par mois depuis le premier achat
    f['freq_30_vs_rate'] = n_w[30] / rate.where(rate > 0)
    f['basket_90_vs_hist'] = f['basket_mean_90'] / f['basket_mean_all'].where(f['basket_mean_all'] > 0)

    # ------------------------------------------------ Indicateurs ticket par ticket, moyennés par client
    mth, hour, dow = P['ts'].dt.month, P['ts'].dt.hour, P['ts'].dt.dayofweek
    ly0 = ref - pd.DateOffset(years=1)
    in_ly = (P['ts'] >= ly0) & (P['ts'] < ly0 + pd.DateOffset(months=1))
    P['fl_ly'] = in_ly.astype(float)
    P['spend_ly'] = P['basket_value'] * P['fl_ly']
    P['rate_t'] = P['discount_amount'] / P['gross_amount'].where(P['gross_amount'] > 0)
    flags = {
        'share_july': mth == 7, 'share_summer_months': mth.isin([7, 8]),
        'share_xmas': ((mth == 12) & (P['ts'].dt.day >= 20)) | ((mth == 1) & (P['ts'].dt.day <= 4)),
        'share_lockdown': (P['ts'] >= LOCKDOWN[0]) & (P['ts'] < LOCKDOWN[1]),
        'share_weekend': dow >= 5, 'share_saturday': dow == 5, 'share_evening': hour >= 18, 'share_morning': hour < 12,
        'share_tickets_disc': P['discount_amount'] > 0,
        'share_pay_card': P['payment_card'] > 0, 'share_pay_cash': P['payment_cash'] > 0,
        'share_pay_cheque': P['payment_cheque'] > 0, 'share_pay_gift': P['payment_gift'] > 0,
    }
    pay_n = P[['payment_card', 'payment_cash', 'payment_cheque', 'payment_gift']].sum(axis=1)
    flags['share_pay_mixed'], flags['share_pay_none'] = pay_n >= 2, pay_n == 0
    seg = P['price_segmentation'].fillna('INCONNU').replace({'8': 'xx'})
    for s in SEGMENTS:
        flags[f'share_seg_{s.lower()}'] = seg == s
    F = pd.DataFrame({k: v.astype('int8') for k, v in flags.items()})
    F['id_client'] = P['id_client'].values
    sh = F.groupby('id_client').mean().reindex(idx)
    for k in flags:
        f[k] = sh[k]

    # Saisonnalité : même mois l'an passé
    f['n_tickets_same_month_ly'] = _reindexed(P.groupby('id_client')['fl_ly'].sum(), idx, 0.0)
    f['spend_same_month_ly'] = _reindexed(P.groupby('id_client')['spend_ly'].sum(), idx, 0.0)
    f['bought_same_month_ly'] = (f['n_tickets_same_month_ly'] > 0).astype('int8')

    # ------------------------------------------------ Promotions et retours
    gross_all = _reindexed(g['gross_amount'].sum(), idx, 0.0)
    disc_all = _reindexed(g['discount_amount'].sum(), idx, 0.0)
    f['discount_rate_all'] = disc_all / gross_all.where(gross_all > 0)
    s90 = P.loc[P['age'] <= 90].groupby('id_client')
    gross90, disc90 = _reindexed(s90['gross_amount'].sum(), idx, 0.0), _reindexed(s90['discount_amount'].sum(), idx, 0.0)
    f['discount_rate_90'] = disc90 / gross90.where(gross90 > 0)
    f['discount_rate_max'] = _reindexed(P.groupby('id_client')['rate_t'].max(), idx)
    has_d = P['discount_amount'] > 0
    f['n_tickets_disc'] = _reindexed(P.loc[has_d].groupby('id_client').size(), idx, 0).astype(float)
    f['basket_mean_disc'] = _reindexed(P.loc[has_d].groupby('id_client')['basket_value'].mean(), idx)
    f['basket_mean_nodisc'] = _reindexed(P.loc[~has_d].groupby('id_client')['basket_value'].mean(), idx)
    gr = ret.groupby('id_client')
    n_ret = _reindexed(gr.size(), idx, 0).astype(float)
    f['n_returns'] = n_ret
    f['share_returns'] = n_ret / (n_ret + n_all).where((n_ret + n_all) > 0)
    f['return_amount'] = _reindexed(-gr['basket_value'].sum(), idx, 0.0).clip(lower=0)

    # ------------------------------------------------ Segment de prix (constant par client dans les données : on prend le segment dominant)
    seg_cols = [f'share_seg_{s.lower()}' for s in SEGMENTS]
    dom = sh[seg_cols].fillna(-1).idxmax(axis=1).str.replace('share_seg_', '', regex=False)
    names = {s.lower(): s for s in SEGMENTS}
    f['price_segment'] = dom.map(names).where(n_all > 0, 'INCONNU')
    f['price_segment_missing'] = (f['price_segment'] == 'INCONNU').astype('int8')

    # ------------------------------------------------ Magasins
    cnt = P.groupby(['id_client', 'store5']).agg(n=('ts', 'size'), last=('ts', 'max')).reset_index()
    main = (cnt.sort_values(['id_client', 'n', 'last'], ascending=[True, False, False])
               .drop_duplicates('id_client').set_index('id_client').reindex(idx))
    f['n_stores'] = _reindexed(cnt.groupby('id_client').size(), idx, 0).astype(float)
    f['n_regions'] = _reindexed(g['store_region'].nunique(), idx, 0).astype(float)
    f['main_store_share'] = main['n'] / n_all.where(n_all > 0)
    last_store = _reindexed(g['store5'].last(), idx)
    f['last_store_is_main'] = ((last_store == main['store5']) & main['store5'].notna()).astype('int8')
    f['main_store_region'] = main['store5'].str[:2].fillna('INCONNU')
    store_clients = cnt.groupby('store5').size() / len(idx) * 100.0      # part des clients de la base présents dans le magasin
    f['main_store_client_share'] = main['store5'].map(store_clients)

    # ------------------------------------------------ Profil client
    cl = clients
    dept = cl['dept']
    f['main_store_outside_home_dept'] = (dept.notna() & (f['main_store_region'] != dept) &
                                         (f['main_store_region'] != 'INCONNU')).astype('int8')
    f['civility'] = cl['civility'].fillna('ND')
    f['has_email'] = cl['has_email'].astype('int8')
    f['email_domain'] = cl['email_domain'].fillna('SANS_EMAIL')
    f['email_type'] = _email_type(cl['email_domain'])
    f['dept'] = dept.fillna('INCONNU')
    f['dept_missing'] = dept.isna().astype('int8')
    f['has_card'] = cl['has_card'].astype('int8')
    ten = (ref - cl['card_date']).dt.total_seconds() / 86400.0
    ten = ten.where(ten >= 0)                                             # carte postérieure à ref_date : valeur corrompue
    f['card_tenure_days'] = ten
    f['card_joined_in_window'] = (ten <= 366).astype('int8')
    f['multicard'] = cl['multicard'].fillna(0).astype('int8')
    f['anonymous'] = cl['anonymous'].astype('int8')

    out = pd.DataFrame({k: f[k].reindex(idx) for k in FEATURE_NAMES})
    for col in out.columns:                                               # types de sortie : float / int8 / str
        typ = SPEC.loc[col, 'type']
        if typ == 'num':
            out[col] = out[col].astype('float64')
        elif typ == 'bin':
            out[col] = out[col].astype('int8')
        else:
            out[col] = out[col].astype(str)
    out.index.name = 'id_client'
    # Aucun inf (les ratios sont protégés par des planchers) : garde-fou
    num = out.select_dtypes('float64')
    assert np.isfinite(num.to_numpy()[~np.isnan(num.to_numpy())]).all(), 'valeur infinie dans les features'
    return out


# ============================================================ prétraitement appris sur le train
def fit_preprocessing(X, cap_q=CAP_Q, skew_thr=SKEW_LOG):
    """Apprend sur la table de features du TRAIN : plafonds, modalités gardées, colonnes à doubler en log."""
    from scipy.stats import skew
    caps = {}
    for col, rule in CAP_COLS.items():
        hi = float(X[col].quantile(cap_q))
        lo = float(X[col].quantile(1 - cap_q)) if rule == 'both' else None
        caps[col] = (lo, hi)
    rare = {}
    for col, (min_frac, always) in RARE_RULES.items():
        cnt = X[col].value_counts()
        min_count = min_frac if min_frac >= 1 else min_frac * len(X)      # >= 1 : seuil en nombre de clients
        rare[col] = sorted(set(cnt.index[cnt >= min_count]) | set(always))
    log_cols = []
    for col, (lo, hi) in caps.items():
        v = X[col].clip(lower=lo, upper=hi).dropna()
        if lo is None and len(v) and v.min() >= 0 and skew(v) > skew_thr:
            log_cols.append(col)
    return {'cap_q': cap_q, 'caps': caps, 'rare_levels': rare, 'log_cols': log_cols}


def apply_preprocessing(X, params):
    """Applique plafonds, regroupement des modalités rares et jumeaux log (paramètres appris sur le train)."""
    X = X.copy()
    for col, (lo, hi) in params['caps'].items():
        X[col] = X[col].clip(lower=lo, upper=hi)
    for col, keep in params['rare_levels'].items():
        X[col] = X[col].where(X[col].isin(keep), 'AUTRE')
    for col in params['log_cols']:
        X[LOG_PREFIX + col] = np.log1p(X[col])
    return X
