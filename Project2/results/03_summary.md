# Résumé du notebook 03 : modèles de référence (règle, logistique, arbre, k-NN, Naive Bayes)

## Chiffres clés (CV 5 plis communs, scores hors-échantillon ; top 10 % = 10 % des clients les mieux classés)
- **Meilleur modèle du notebook : `logreg_lasso`**, AUC 0.8714 (écart-type entre plis 0.0024), top 10 % : précision 39.3 %, rappel 50.9 %, lift 5.09.
- Référence à battre : récence seule AUC 0.8180, précision 23.5 %, lift 3.04 ; LightGBM de contrôle (notebook 02, non réglé) AUC 0.8775.
- Les 6 variantes logistiques sont à 0.0019 d'AUC l'une de l'autre : le choix se fait sur l'interprétabilité.
- Lasso parcimonieux : 44 coefficients non nuls sur 165 (meilleur AUC : 91).

| modèle | AUC | écart-type plis | log-loss | précision top 10 % | rappel top 10 % | lift |
|---|---|---|---|---|---|---|
| `logreg_lasso` | 0.8714 | 0.0024 | 0.1949 | 39.3 % | 50.9 % | 5.09 |
| `logreg_enet` | 0.8713 | 0.0024 | 0.1949 | 39.3 % | 50.9 % | 5.09 |
| `logreg_ridge` | 0.8712 | 0.0024 | 0.1950 | 39.2 % | 50.7 % | 5.07 |
| `logreg` | 0.8711 | 0.0024 | 0.1951 | 39.1 % | 50.7 % | 5.07 |
| `logreg_lasso_1se` | 0.8708 | 0.0024 | 0.1952 | 39.1 % | 50.6 % | 5.06 |
| `logreg_binned` | 0.8695 | 0.0029 | 0.1971 | 39.1 % | 50.6 % | 5.06 |
| `tree` | 0.8640 | 0.0030 | 0.1986 | 37.7 % | 48.9 % | 4.89 |
| `knn` | 0.8633 | 0.0025 | 0.2002 | 37.6 % | 48.7 % | 4.87 |
| `nb` | 0.8594 | 0.0026 | 1.1047 | 35.8 % | 46.3 % | 4.63 |
| `nb_all` | 0.8472 | 0.0020 | 2.8818 | 33.4 % | 43.3 % | 4.33 |
| `rfm_score` | 0.8407 | 0.0030 | - | 32.7 % | 42.3 % | 4.23 |
| `recency_rule` | 0.8180 | 0.0035 | - | 23.5 % | 30.4 % | 3.04 |

## Figures (message)
- `figures/03_reglage_penalises.png` : l'AUC est quasi plate autour de l'optimum de C : le réglage de la pénalité compte peu.
- `figures/03_lasso_chemin.png` : à la pénalité maximale, 5 variables survivent (active_weeks_share, log_n_tickets_14, log_n_tickets_30, log_n_tickets_60…) ; le nombre de variables retenues croît avec C.
- `figures/03_odds_ratios.png` : odds ratios (avec IC 95 %) des 20 variables les plus influentes du modèle parcimonieux.
- `figures/03_arbre_surapprentissage.png` : sans garde-fou la validation retombe quand la profondeur croît ; la taille de feuille stabilise.
- `figures/03_arbre_lisible.png` : un arbre à 3 niveaux = 7 règles de segmentation du rachat.
- `figures/03_knn_k.png` : le k optimal du k-NN grandit avec la taille de l'échantillon.
- `figures/03_auc_par_pli.png` : AUC par pli, très stable ; l'écart entre familles dépasse l'écart entre plis.
- `figures/03_roc_gain.png` : ROC et gain cumulé : part des racheteurs captés en ciblant 10 % de la base.
- `figures/03_matrice_confusion.png` : matrice de confusion au seuil du top 10 % (meilleur modèle vs récence).
- `figures/03_calibration.png` : la logistique est bien calibrée, Naive Bayes ne l'est pas.
- `figures/03_deciles.png` : taux de rachat par décile de score du meilleur modèle.

## Décisions méthodologiques
- Linéaires : jumeau log à la place de l'original (AUC +0.0008 vs brut), médiane + standardisation, one-hot N-1 (référence = modalité la plus fréquente). Arbres : variables brutes, NaN natifs.
- Hyperparamètres : grid search (Ridge, Lasso, binned, arbre, k-NN, Naive Bayes) et random search (ElasticNet) sur 40 000 clients stratifiés, 5 plis, critère AUC ; puis CV complète. Règle de l'écart-type pour le Lasso parcimonieux.
- Variables discrétisées : 5 classes de quantiles + Ridge (C=0.0316). k-NN : 8 variables choisies a priori (R, F, M, rythme), k=800 réglé à pleine taille. SVM non entraîné (coût sur 160 000 lignes).
- Prédiction du test = moyenne des 5 modèles de plis. Soumission du meilleur : `submissions/03_best_logreg_lasso.csv` (non envoyée à Kaggle).

## Anomalies et points de vigilance
- Le notebook 02 annonçait 31 jumeaux log et 49 colonnes à NaN ; la table enregistrée en contient 19 et 50.
- Récence et RFM : peu de valeurs distinctes, beaucoup d'ex-aequo à la coupure du top 10 % (départage par l'ordre des identifiants).
- Odds ratios : corrélation maximale 0.92 entre variables de comptage retenues : lecture conjointe obligatoire.

## Limites et pistes
- Plafond linéaire : LightGBM non réglé à 0.877 d'AUC contre 0.871 ici : non-linéarités et interactions (notebook 04).
- Réglage sur un sous-échantillon du train (léger optimisme) ; plis aléatoires, une seule coupure ; cible plus étroite que « acheter dans le mois ».
- Pistes : forêt aléatoire, XGBoost, LightGBM réglés ; interactions et splines pour la logistique ; données ouvertes ; suivi de la dérive.
