# Résumé du notebook 02 : feature engineering

## Chiffres clés
- **Entrée** : 3 292 994 tickets / 160 424 clients (train), 822 894 tickets / 40 106 clients (test). Photo au 01/08/2020, cible = achat en août 2020 (taux 7,7 %).
- **98 variables brutes** construites en 3 s (même fonction `features.build_features` pour train et test) ; **100 colonnes** enregistrées après retrait de 17 quasi-doublons (|ρ de Spearman| > 0.95) et ajout de 31 jumeaux log.
- Répartition (colonnes enregistrées) : Récence 4, Fréquence 15, Montant 15, Rythme et tendance 20, Saisonnalité 10, Promotions et retours 10, Paiement 6, Segment de prix 2, Magasins 7, Profil client 11.
- **Récence seule** (règle, AUC sur le train) : **0.8180** ; top 10 % : précision 23,5 %, rappel 30,4 %, lift 3.04.
- **LightGBM de contrôle** (200 arbres, sans réglage, 5 plis communs, toutes variables) : **AUC 0.8775** (écart-type entre plis 0.0018) ; top 10 % : précision 40,4 %, rappel 52,3 %, lift 5.23. Indication, pas un modèle candidat.
- Meilleures AUC univariées : `n_tickets_90` 0.852, `n_tickets_60` 0.850, `n_tickets_180` 0.846, `n_tickets_30` 0.837, `active_weeks_share` 0.833 (définition : AUC d'une variable seule utilisée comme score ; exploration descriptive).

## Figures (message)
- `figures/02_fenetres_observation.png` : Chaque client est décrit au 1er août 2020 sur plusieurs fenêtres glissantes ; la cible est le mois qui suit
- `figures/02_recence_rachat.png` : Un achat dans les 7 derniers jours : 22,5 % de rachat en août ; plus de 180 jours d'absence : 0,5 %
- `figures/02_frequence_rachat.png` : Le rachat grimpe avec la fréquence : 0,5 % pour un ticket sur l'année, 31,9 % au-delà de 50 tickets
- `figures/02_montant_rachat.png` : Plus on dépense, plus on rachète (0,5 % → 28,4 % du 1er au 10e décile) ; le panier moyen, lui, discrimine bien moins
- `figures/02_rfm_grille.png` : Grille RFM par quintiles : 30,9 % de rachat pour les clients à la fois récents et fréquents, 0,3 % pour les anciens et rares
- `figures/02_rythme_tendance_rachat.png` : Un client dans son rythme (retard < 1) rachète 14,3 %, un client très en retard (> 8) seulement 1,0 % ; une forte baisse récente de fréquence signale un client qui décroche
- `figures/02_saisonnalite_rachat.png` : À récence comparable, avoir déjà acheté en août 2019 multiplie le rachat par environ 1,9 ; parmi les clients réguliers, la part de week-end reste liée au rachat, la part du soir beaucoup moins
- `figures/02_promotions_rachat.png` : À fréquence comparable (≥ 8 tickets), les clients qui achètent en promotion rachètent davantage : 6,7 % sans aucun ticket remisé, 19,4 % au-delà de 75 % de tickets remisés
- `figures/02_paiement_rachat.png` : Le mode de paiement dominant sépare peu les clients : écart d'au plus 1,9 point(s) de rachat sur toute la base, 1,2 à fréquence comparable
- `figures/02_segment_prix_rachat.png` : Le segment de prix sépare les clients (4,0 % à 10,6 % de rachat), mais l'écart s'estompe à fréquence comparable (12,8 % à 14,9 %) : le segment « INCONNU » regroupe surtout des clients peu fréquents
- `figures/02_magasins_rachat.png` : Le territoire compte : le taux de rachat varie de 5,5 % à 11,7 % selon la région du magasin principal, et le multi-magasin signale un client plus actif
- `figures/02_profil_rachat.png` : Carte de fidélité (14,9 %) et multicard (15,2 %) : environ deux fois plus de rachat que le reste de la base (7,7 %) ; profils anonymes (0,1 %) et domiciles inconnus (3,8 %) : très peu
- `figures/02_valeurs_manquantes.png` : Les valeurs manquantes sont structurelles (non défini, pas oublié) : 21 variables ont des NaN, et pour 14 variables contrôlées sur 15 ils s'expliquent exactement par une condition simple
- `figures/02_valeurs_extremes.png` : Quelques clients très atypiques étirent les distributions : le plafond au 99,9e percentile touche au plus 0,2 % des clients par variable
- `figures/02_train_vs_test.png` : Train et test se ressemblent : la statistique de KS ne dépasse 0.033 et sa médiane est de 0.003 sur 123 variables ; le plus grand écart est celui de card_tenure_days, variable à faible effectif
- `figures/02_correlations_detail.png` : Récence, fréquence et montant forment un gros bloc de variables très corrélées ; paiement, segment de prix, magasins et profil sont presque indépendants du reste
- `figures/02_correlations_familles.png` : Entre familles, la corrélation absolue moyenne va de 0.02 à 0.55 : les familles apportent des informations différentes
- `figures/02_auc_univariee.png` : La fréquence récente porte le plus de signal (AUC univariée jusqu'à 0,85) ; paiement, segment de prix, magasins et profil restent sous 0,65
- `figures/02_deciles_rachat.png` : Déciles de rachat des 8 variables les plus informatives (et peu redondantes) : de 0,7 % à 35,2 % de rachat selon le décile de n_tickets_180
- `figures/02_apport_familles.png` : Un LightGBM sans réglage passe de 0.818 (récence seule) à 0.878 d'AUC ; l'essentiel du gain vient de « Récence » et « Fréquence », le reste ajoute très peu
- `figures/02_importance_controle.png` : Le modèle de contrôle s'appuie surtout sur les familles « Récence » et « Fréquence » (68 % du gain à elles deux)

## Décisions méthodologiques
- **Aucune fuite** : variables calculées avec les seuls tickets antérieurs au 01/08/2020 ; cible jamais utilisée pour fabriquer une variable ; plafonds, modalités rares et choix des jumeaux log appris sur le train puis appliqués au test.
- **Achats vs retours** : récence, fréquence et montants sur les tickets d'achat (panier > 0) ; retours décrits à part.
- **Manquants** : compte sans achat dans une fenêtre = 0 ; grandeur non définie (intervalle d'un client à 1 ticket, panier moyen sans ticket) = `NaN` + indicateur (`is_one_shot`, `has_interval_std`) ; attribut qualitatif absent = modalité à part (segment de prix INCONNU, SANS_EMAIL, département INCONNU, civilité ND). Aucun client supprimé.
- **Valeurs extrêmes** : plafonnement au P99,9 du train (tickets : panier et articles, avant agrégation ; clients : 56 variables non bornées) ; log(1+x) ajouté (jumeau) pour 31 variables restées très asymétriques (> 3).
- **Modalités rares** (domaine d'e-mail, département, région du magasin) regroupées en AUTRE. One-hot et standardisation laissés aux pipelines des modèles ; discrétisation en classes uniquement pour les graphiques.
- **Quasi-doublons** (|ρ| > 0.95) : on garde la variable la plus en amont dans le dictionnaire, sans regarder la cible. Fenêtre de 365 jours non construite (≈ historique de 366 jours).

## Anomalies et points de vigilance
- 10 clients du train n'ont que des retours (aucun achat) : récence `NaN`. Cartes de fidélité postérieures à la date de référence ou sans date valide traitées comme manquantes.
- La fréquentation du magasin principal est mesurée dans chaque échantillon (part des clients de la base) : plus bruitée sur le test (20 %).
- La cible (7,7 % de rachat) est plus étroite que « acheter dans le mois » : seul le classement compte, les probabilités ne sont pas des taux mensuels (cf. notebook 01).
- Heures des tickets : profil proche d'heures locales malgré la mention UTC ; parts matin/soir à lire avec prudence.
- `price_segmentation` est constant au sein d'un client (100,0 % des clients) et absent pour 56,7 % d'entre eux : traité comme un attribut client (`price_segment`, INCONNU = modalité à part).
- Corrélation brute vs apport marginal : l'écart de rachat entre segments de prix se réduit fortement à fréquence comparable (≥ 8 tickets) ; le mode de paiement discrimine peu dans tous les cas.

## Limites et pistes
- Une seule coupure (1er août) donc pas de saisonnalité apprenable ; fenêtres fixes ; segment de prix manquant pour une grande part des clients ; AUC univariée et ablation descriptives.
- Pistes (phase d'optimisation) : données ouvertes via le code INSEE (revenu, population, densité, type de commune), calendrier et météo, multi-coupures, décroissances exponentielles, interactions, ACP.
