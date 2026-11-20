# Projet 2 : brief commun (à lire avant de toucher à quoi que ce soit)

Cours **Marketing Econometrics** (TSE M2, A. Blanpied, AVISIA). Projet 2 : *prédire qui va racheter le mois prochain*. Livrable final = soutenance orale de 15 min (deck, fait **en dernier**) + soumission Kaggle (AUC, 30 % de la note ; l'oral compte 70 %).
Ce brief sert à produire **tous les notebooks** du projet, en parallèle, sans sortir du cadre méthodologique du cours. L'optimisation Kaggle viendra dans une phase ultérieure : **ne pas la faire maintenant**.

## 1. Le problème

- Enseigne de supermarché. Le marketing prépare un e-mail promo et veut cibler **au plus 10 % de la base** : les clients les plus susceptibles de racheter. On construit un **score de propension**, puis on recommande comment s'en servir (**focus sur un segment : obligatoire à l'oral**).
- Données : transactions du **01/08/2019 au 31/07/2020** (12 mois). **Cible** : `repurchase = 1` si le client achète en **août 2020**, 0 sinon. Train : 160 424 clients, 3,3 M de lignes, taux de rachat **7,72 %** (12 392 positifs). Test : 40 106 clients (tirage aléatoire de 20 %, sans cible), 0,82 M de lignes. Aucune ligne d'août 2020 dans les fichiers : pas de fuite directe.
- Soumission Kaggle : CSV `ID,Expected` (ID = id_client, Expected = probabilité). Métrique : **AUC**. Soumission de référence de l'enseignante : AUC 0,74181.
- Colonnes : `id_client`, `transaction_date` (UTC), `stores_nb` (2 premiers chiffres = région ; les 3 derniers ne sont PAS un code postal), `item_count`, `gross_amount`, `discount_amount`, `basket_value` (= gross − discount, vérifié), `payment_gift/cheque/cash/card` (0/1, paiement partiel possible), `email_domain`, `civility` (M, MME, NR), `zip_code` (INSEE du client), `card_subscription` (date d'adhésion à la carte de fidélité), `multicard` (0/1), `price_segmentation` (Access, Mixte, Quali, xx, 8).
- Faits déjà établis (à confirmer/chiffrer proprement dans le notebook 01) : plusieurs lignes pour un même (client, instant) = un seul ticket (paiement fractionné) ; attributs client constants par client ; 0,2 % de tickets de retour (panier ≤ 0) ; `stores_nb` a perdu son zéro initial (rétabli dans `store5`), alors que les `zip_code` à 4 chiffres sont des adresses suisses/belges (`dept = 'ETR'`) et `00000` un code inconnu ; `card_subscription` vide à 97 % des clients (c'est une date) ; un seul client corrompu (44 lignes : `multicard` = 21, `price_segmentation` = '08', carte texte) ; ~0,5 % de profils anonymes (civilité et multicard absents, taux de rachat ≈ 0) ; 45 % des clients sans e-mail (injoignables par e-mail : à garder en tête pour le ciblage) ; creux d'activité mars-avril 2020 (confinement) ; **août 2019 est le 2e mois le plus actif de l'historique, après décembre** (pas un creux) ; un seul mois cible, donc pas de saisonnalité apprenable ; la cible est plus étroite que « acheter dans le mois » (les 7,7 % équivalent à environ 1,9 jour d'activité) : seul le classement compte, les probabilités ne sont pas des taux mensuels.
- Repères déjà vus (train) : taux de rachat selon la récence du dernier achat : 22,5 % (≤ 7 j), 10,9 % (8-14 j), 6,6 % (15-30 j), 3,4 % (31-60 j), 0,5 % (> 180 j). Selon le nombre de tickets sur 12 mois : 0,5 % (1) à 31,8 % (> 50). Cibler les 10 % de clients les plus récents donne 23,6 % de précision et 30,6 % de rappel. Le **modèle doit faire mieux que la seule récence**.

## 2. Socle technique (déjà en place, **ne pas modifier `common.py`** : si un bug apparaît, le signaler dans votre rapport final)

Dossier de travail : `Project2/` (sous `~/Documents`, sauvegardé par Google Drive). Importer avec `import common as c` (le notebook s'exécute dans `Project2/`).

| Élément | Rôle |
|---|---|
| `c.load_clean('train'/'test')` | retourne `(tickets, clients)` nettoyés (cache dans `WORK`). `tickets` : une ligne par ticket (`id_client, ts, store5, store_region, item_count, gross_amount, discount_amount, basket_value, payment_*, price_segmentation, n_lines, is_return`). `clients` : une ligne par client (`email_domain, has_email, civility, zip5, dept, has_card, card_date, multicard, anonymous`). Lire `common.py` (`_clean`) pour les règles exactes. |
| `c.load_target()` | cible du train, indexée par `id_client` |
| `c.get_folds()` | numéro de fold 0 à 4 par client du train (stratifié, seed 42). **Tous les modèles utilisent ces mêmes folds.** |
| `c.REF_DATE`, `c.START_DATE`, `c.SEED`, `c.TOP_FRAC` | 2020-08-01, 2019-08-01, 42, 0,10 |
| `c.save_features(split, df)` / `c.load_features(split)` | table de features (index `id_client`), produite par le notebook 02 |
| `c.save_predictions(name, oof, test)` / `c.load_predictions(name)` | scores hors-échantillon (CV) du train + scores du test, par modèle |
| `c.write_submission(test_scores, name)` | écrit `submissions/<name>.csv` au format Kaggle |
| `c.cv_report(y, oof, folds)` | AUC, AUC par fold (moyenne, écart-type), log-loss, précision / rappel / lift dans le top 10 % |
| `c.topk_metrics(y, score)` | précision, rappel, lift pour les 10 % meilleurs scores |
| `c.save_fig(fig, name)`, `c.save_result(name, obj)`, `c.set_style()`, couleurs `c.ACCENT, c.BLUE, c.GREY, c.INK, c.INK2, c.GREEN, c.PURPLE` | sorties |

Environnement : `~/.venvs/marketing-econometrics/bin/python` (pandas, numpy, pyarrow, scikit-learn, lightgbm, xgboost, shap, statsmodels, scipy, seaborn, matplotlib, nbformat, nbconvert). Machine : 10 cœurs, 17 Go de RAM, **plusieurs agents tournent en même temps** : respecter la limite de `n_jobs` donnée dans votre mission.

**Exécuter un notebook** (toujours avec ces variables, pour ne laisser aucun cache dans Google Drive) :

```bash
cd "~/Documents/TSE/M2_ECOSTAT/Econométrie du Marketing/Project2"
export PYTHONPYCACHEPREFIX=~/.cache/pycache MPLCONFIGDIR=~/.cache/matplotlib NUMBA_CACHE_DIR=~/.cache/numba
~/.venvs/marketing-econometrics/bin/jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=3600 NN_Nom.ipynb
```

Règles Drive : **jamais de `.venv`, de `__pycache__`, de `.ipynb_checkpoints`, `.pytest_cache`, `.ruff_cache` dans `Project2/`** (vérifier avec `find` avant de finir). Gros fichiers intermédiaires (parquet, modèles) dans `c.WORK` uniquement, jamais dans le projet. Fabriquer les notebooks par un script (nbformat) rangé dans le scratchpad de la session, pas dans le projet.

## 3. Cadre méthodologique : on reste dans le cours (slides « 2026 TSE Econometrie du Marketing - ES.pdf »)

**Autorisé** (le cours le cite) :
- *Cadrage* (p. 50-52, 82-84) : définir la cible, le périmètre, la profondeur d'historique, la fenêtre de calcul de la cible, la saisonnalité ; features comportementales et transactionnelles ; enrichissement par données ouvertes (à citer comme piste, pas d'accès web ici).
- *Préparation* (p. 85-88) : agrégation par client, extraction de la date (jour, semaine, mois, week-end), proportions et écarts à la moyenne, qualité des données (récence des données, valeurs extrêmes via écart-type ou percentiles, **valeurs aberrantes traitées par plafonnement ou suppression**, **valeurs manquantes traitées par suppression ou imputation** : règle métier, moyenne/médiane, etc.), standardisation/normalisation, discrétisation en classes, **one-hot encoding (N-1 indicatrices)**, regroupement de modalités, transformation log, analyse des distributions et contrôle des corrélations, sélection de variables (pré-filtrage, Lasso/Ridge/ElasticNet, arbres, boosting).
- *RFM* (p. 23-28) : R, F, M ; seuils par quantiles ou métier ; 27 segments regroupés en segments actionnables (Top, Good, Décélération, Small, Weak, New, Inactive).
- *Segmentation* (p. 31-47) : K-Means, CAH (Ward, dendrogramme), nombre de classes par coude/silhouette, ACP (variables quantitatives) / ACM (qualitatives), interprétation par profils, **modèle de réaffectation** (arbre de décision, régression logistique).
- *Modèles de scoring* (p. 50-64) : régression logistique (cote/odds ratios), régression pénalisée (Ridge, Lasso, ElasticNet), arbre de décision, forêt aléatoire, gradient boosting (**XGBoost, LightGBM**), k plus proches voisins (référence), SVM et Naive Bayes (cas particuliers).
- *Validation* (p. 66-73) : découpage entraînement / validation / test, validation croisée à K plis, **grid search / random search** (optimisation bayésienne citée comme concept), métriques **AUC, log-loss, précision, rappel, F1, exactitude, matrice de confusion**, stabilité entre plis, interprétabilité, compromis performance/interprétabilité/contraintes opérationnelles, **SHAP** (p. 64).
- *Recommandations et déploiement* (p. 74-76, 89) : ciblage, personnalisation, **test A/B** (groupe témoin), seuil de remise, suivi du modèle (dérive, ré-entraînement), boucle de rétroaction. Même esprit que le Projet 1 : leviers chiffrés, plan d'action priorisé, dimensionnement du test A/B, scénarios économiques avec hypothèses explicites.

**Interdit dans cette première passe** (réservé à la phase d'optimisation Kaggle, plus tard) : empilement/stacking/blending de modèles, réseaux de neurones, target encoding ou encodages par la cible, cibles construites sur des mois passés (multi-coupures), optimisation bayésienne (Optuna), sélection de variables par recherche exhaustive, tout ce qui n'est pas dans la liste ci-dessus. Pas d'accès web, pas de données externes. **Ne jamais utiliser la cible pour fabriquer une feature** (hors modèle), ni le test pour décider quoi que ce soit.

Dans chaque notebook : une courte mention **« Lien avec le cours »** (slide) à chaque choix méthodologique important, et une section finale **« Limites et pistes d'amélioration »** (ce qui n'a pas marché, ce qu'on ferait ensuite : alimente la phase d'optimisation et la critique exigée à l'oral).

## 4. Conventions de livraison

- **Langue** : notebooks en français (markdown, titres de graphiques, légendes), identifiants de code en anglais. Ton : celui d'un data scientist qui explique ses choix à un directeur marketing à l'aise avec les données (« pourquoi » avant « comment »). Pas de cours magistral sur les algorithmes.
- **Notebooks** : exécutés de bout en bout, sorties conservées (`--inplace`), exécutables séparément dans l'ordre. Un notebook relit les artefacts des précédents via `common`, il n'embarque pas le code des autres. Code lisible, sans cellule morte, temps total ≲ 15-20 min.
- **Figures** : `figures/NN_nom.png` via `c.save_fig`, style `c.set_style()`, titre = le message (ex. « Un client sur quatre qui a acheté cette semaine rachète sous un mois »), axes lisibles en français.
- **Résultats** : tableaux/json via `c.save_result('NN_nom', ...)`. Chaque notebook écrit en plus **`results/NN_summary.md`** (≤ 60 lignes) : chiffres clés (avec leur définition), liste des figures avec leur message en une phrase, décisions méthodologiques prises (et pourquoi), anomalies, limites, pistes d'amélioration. C'est la matière première du deck et de l'oral.
- **Chiffres** : tout chiffre cité dans un markdown doit venir d'une cellule exécutée (pas de recopie à la main de valeurs qui pourraient changer). Arrondir proprement, donner les définitions.
- **Interdits** : pas de commit git, pas de modification des fichiers d'un autre notebook ou de `common.py`, pas de modification de `Data/`, **pas de soumission sur Kaggle**, pas de dépendance nouvelle sans nécessité (si indispensable : `uv pip install -p ~/.venvs/marketing-econometrics/bin/python <pkg>` et le signaler).

## 5. Carte des notebooks

| N° | Fichier | Contenu | Entrées | Sorties |
|---|---|---|---|---|
| 01 | `01_Data_Overview.ipynb` | contexte, périmètre, statistiques descriptives, qualité des données, justification des règles de nettoyage de `common.py`, rachat selon les variables brutes | `c.load_raw`, `c.load_clean` | `figures/01_*`, `results/01_*`, `results/01_summary.md` |
| 02 | `02_Feature_Engineering.ipynb` + `features.py` | construction des features client, traitement des valeurs manquantes/aberrantes, lien features ↔ rachat, corrélations | `c.load_clean`, `c.load_target` | `c.save_features`, `results/02_feature_dictionary.csv`, figures, résumé |
| 03 | `03_Modeles_Baselines.ipynb` | règle de récence, régression logistique (+ Ridge/Lasso/ElasticNet), arbre, kNN, (Naive Bayes) en CV | features | prédictions `c.save_predictions`, `results/03_model_comparison.csv`, soumission du meilleur |
| 04 | `04_Modeles_Arbres_Boosting.ipynb` | forêt aléatoire, XGBoost, LightGBM, grid/random search, CV | features | prédictions, `results/04_model_comparison.csv`, soumissions |
| 05 | `05_Segmentation.ipynb` | segmentation RFM (règles du cours) et/ou clustering, taux de rachat par segment, candidats pour le segment cible | features, cible | `results/05_*`, figures |
| 06 | `06_Modele_Final_Interpretation.ipynb` | sélection du modèle final, SHAP, profil du racheteur, calibration, courbes gain/lift | prédictions 03 et 04 | `results/best_model.json`, prédictions finales, soumission finale |
| 07 | `07_Recommandations.ipynb` | usage du score pour la campagne (top 10 %), segment cible, scénarios économiques, test A/B, plan d'action | 05, 06 | `results/07_*`, figures |

Convention des noms de prédictions : `c.save_predictions('<famille>_<variante>', oof, test)`, par ex. `logreg_l1`, `rf_tuned`, `lgbm_tuned`.
Convention du tableau de comparaison (`results/03_...`, `04_...`) : une ligne par modèle, colonnes `model, family, params, auc, auc_fold_mean, auc_fold_std, logloss, precision_top10, recall_top10, lift_top10, fit_seconds, interpretability, remark` (sorties de `c.cv_report` + temps + commentaire).
Prédiction du test : moyenne des scores des 5 modèles de fold (ou ré-ajustement sur tout le train, à documenter).
Réglage des hyperparamètres : recherche sur un sous-échantillon stratifié du train (≈ 40 000 clients) puis évaluation par la CV complète avec les meilleurs réglages ; le noter comme limite (légère optimisation de l'AUC hors-échantillon).
