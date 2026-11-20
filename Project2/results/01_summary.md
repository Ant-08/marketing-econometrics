# Notebook 01 · Vue d'ensemble et qualité des données : résumé

## Chiffres clés (train, 01/08/2019 → 31/07/2020, cible = achat en août 2020)
- **Volumes** : 3 298 736 lignes brutes → 3 292 994 tickets, 160 424 clients (test : 824 282 lignes, 822 894 tickets, 40 106 clients). Client = au moins un ticket sur 12 mois.
- **Taux de rachat** : 7,72 % (12 392 positifs) ; écart entre plis 0,003 point. Train et test comparables (KS ≤ 0,005 ; écart relatif max 5,1 %).
- **Récence** : rachat 22,5 % si dernier achat ≤ 7 j, 0,5 % si > 180 j (définition : jours révolus entre le dernier ticket d'achat et le 01/08/2020). **Fréquence** : 0,5 % (1 ticket) à 48 % (> 100).
- **Règle de référence** (top 10 % des plus récents) : précision 23,5 %, rappel 30,4 %, lift 3,0. AUC univarié : récence 0,814, fréquence 0,820 ; toute autre variable brute < 0,57.
- **Joignabilité** : 45,3 % des clients sans e-mail (injoignables par e-mailing) ; rachat 8,8 % avec e-mail vs 6,4 % sans (écart surtout dû à l'activité).

## Figures (figures/01_*.png)
- `01_cible_vs_activite` : Les acheteurs de juillet rachètent bien moins en août (16 %) que d'un mois à l'autre dans l'historique (62-80 %) : la cible est plus étroite que « acheter dans le mois ».
- `01_carte_adhesions` : Les adhésions à la carte de fidélité s'accélèrent depuis 2018 ; 152 clients partagent la même date (01/01/2016), probablement une date par défaut.
- `01_manquants` : Le taux de manquants dépend du niveau (ligne vs client) et de l'activité : les clients occasionnels sont les moins renseignés.
- `01_distributions_extremes` : Paniers et nombres de tickets suivent une loi très asymétrique : échelle logarithmique obligatoire, plafonnement des extrêmes nécessaire.
- `01_dynamique_mensuelle` : Le confinement réduit le nombre de tickets (-32 % en avril vs janvier-février) mais gonfle le panier (+57 %) : le CA tient.
- `01_rythmes_semaine_heure` : Le samedi concentre le plus de tickets ; la journée a deux pointes (fin de matinée, fin d'après-midi), le dimanche est marginal.
- `01_rachat_recence_frequence_panier` : Un client qui a acheté dans la semaine rachète 48 fois plus souvent que celui qui n'est pas venu depuis six mois ; la fréquence discrimine aussi, le panier peu.
- `01_rachat_profil_client` : Avec e-mail ou carte de fidélité, le rachat est 1,4 fois (e-mail) et 2,0 fois (carte) plus élevé ; les anonymes ne rachètent presque jamais.
- `01_rachat_domaine_geographie` : Le rachat varie du simple au double selon le département du magasin (5 à 12 %), peu selon le domaine d'e-mail ; les clients qui achètent hors de leur département de résidence rachètent moins (5,7 % contre 9,0 %).

## Décisions méthodologiques (détail : results/01_cleaning_decisions.csv)
- Ticket = (client, instant) : 5 742 lignes absorbées (5 691 tickets multi-lignes : paiements fractionnés), totaux conservés. Retours (0,21 % des tickets) gardés avec drapeau, hors récence/fréquence/panier.
- Zéro initial : perdu pour `stores_nb` (rétabli ; concordance magasin/client 89 %) ; **pas perdu pour `zip_code`** : les 554 codes à 4 chiffres sont suisses/belges, donnent `dept = ETR` dans `common._clean` (jamais de `zfill` sur les codes postaux). Les 3 derniers chiffres du magasin ne sont pas un code postal.
- Manquants : pas d'imputation statistique ; modalité « inconnu » (e-mail, code postal, segment de prix, civilité ND, multicard). Les manquants sont liés à l'activité (e-mail absent pour 56 % des clients à 1 ticket vs 34 % à > 100).
- Valeurs extrêmes : détection par percentiles et log (moyenne+3σ biaisée) ; **plafonner au P99,9** (panier 469 €, 338 tickets/client) et log1p ; ne pas supprimer les clients très actifs (rachat 69 % au-delà de 300 tickets). À implémenter au notebook 02.
- `gross − discount = basket` exact : garder panier payé et taux de remise. Pas de variable de mois ni de saison (un seul mois cible).

## Anomalies et défauts de `common.py`
- **Cible** : 7,7 % de rachat contre 62 %-80 % de reconduction mensuelle historique (16 % juillet → août) ≈ activité de 1,9 jour(s) : fenêtre de la cible à vérifier ; seul le classement compte.
- **Un client** (44 lignes) à l'enregistrement corrompu : `card_subscription` textuelle, `multicard` = 21, `price_segmentation` = `08` (modalité absente du test). Le socle met désormais `08` à manquant, `has_card` à faux et `multicard` à manquant.
- **Corrections apportées à `common._clean` suite à ce notebook** : `zip5` limité aux codes à 5 chiffres (« 00000 » : 274 clients → manquant), codes à 4 chiffres (554 clients suisses/belges) → `dept = 'ETR'` ; `has_card` = date valide ; `.upper()` des domaines sans effet ; `price_segmentation` constant par client (pas de « segment dominant »).
- Dates d'adhésion à la carte postérieures au 31/07/2020 (4 clients) ; date par défaut 01/01/2016 (152 clients). Août n'est pas un mois creux : août 2019 est le 2e mois en CA (et en tickets) ; la limite est un seul mois cible, donc pas de saisonnalité apprenable.
- Repères du brief recalculés : rachat 7,72 %, repères de récence (écart max 0,0 point), 0,21 % de retours, 97 % de clients sans carte, 45 % sans e-mail, 0,45 % d'anonymes : confirmés. À nuancer : « 47 % de manquants » de price_segmentation = niveau ligne (57 % des clients) ; août n'est pas un mois creux.

## Limites et pistes
- Cible plus étroite que « acheter dans le mois » (rachat 7,7 % vs reconduction mensuelle historique 62 %-80 %) : fenêtre à vérifier, les probabilités ne sont pas des taux mensuels.
- Un seul mois cible : pas de saisonnalité apprenable ; plis aléatoires, non chronologiques ; confinement mars-mai 2020 ; attributs client non datés ; pas d'information produit.
- Pistes : vérifier la fenêtre de la cible, test A/B avec témoin, enrichissement open data (calendrier, météo, revenus INSEE), segment dédié aux très gros fréquentants, suivi de la dérive des paiements « aucun ».
