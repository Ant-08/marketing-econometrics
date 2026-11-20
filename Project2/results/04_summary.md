# Résumé du notebook 04 : forêts aléatoires et gradient boosting

## Chiffres clés (train, 5 plis communs, hors-échantillon ; top 10 % = les 10 % de clients au meilleur score)
- Repère : règle de récence seule, AUC 0,8180, précision 23,5 %, rappel 30,4 %, lift 3,04 dans le top 10 %.
- `rf_default` : AUC 0,8628 (plis 0,8629 ± 0,0021), lift 5,07, log-loss 0,2106, 5,8 s/pli
- `rf_tuned` : AUC 0,8754 (plis 0,8754 ± 0,0022), lift 5,23, log-loss 0,1916, 19,7 s/pli
- `xgb_default` : AUC 0,8662 (plis 0,8662 ± 0,0029), lift 4,96, log-loss 0,1993, 1,9 s/pli
- `xgb_tuned` : AUC 0,8779 (plis 0,8780 ± 0,0026), lift 5,24, log-loss 0,1899, 3,1 s/pli
- `lgbm_default` : AUC 0,8764 (plis 0,8765 ± 0,0018), lift 5,22, log-loss 0,1909, 1,1 s/pli
- `lgbm_tuned` : AUC 0,8785 (plis 0,8786 ± 0,0022), lift 5,26, log-loss 0,1897, 2,2 s/pli
- **Meilleur modèle du notebook : `lgbm_tuned`**, AUC 0,8785, top 10 % : précision 40,6 %, rappel 52,6 %, lift 5,26 ; hyperparamètres `{"num_leaves": 31, "min_child_samples": 50, "subsample": 0.6, "colsample_bytree": 0.4, "reg_lambda": 20.0, "reg_alpha": 0.1, "learning_rate": 0.04, "subsample_freq": 1, "n_estimators": 207}`. Écart avec le suivant (`lgbm_no_profile`) : +0,0002 d'AUC, très inférieur à l'écart-type entre plis (0,0022).
- Déséquilibre : pondérer les rachats (rapport complet) donne AUC 0,8776 contre 0,8785 pour LightGBM mais log-loss 0,4176 contre 0,1897 : classement identique, probabilités faussées (score moyen = 3,9 × le taux réel).
- Ablation (LightGBM, perte d'AUC moyenne par pli) : Saisonnalité −0,0064 ; Rythme et tendance −0,0003 ; Récence −0,0003 ; les autres familles ≤ 0,0005 ; `share_weekend` + `share_saturday` seules : −0,0054 ; profil d'identité −0,0002 (sans profil : AUC 0,8783 vs 0,8785).
- Variables principales (gain LightGBM) : n_tickets_60, recency_prev_days, n_tickets_180, recency_days, n_tickets_14, share_weekend, n_tickets_30, share_saturday, active_weeks_share, interval_mean_days ; par permutation : share_weekend, recency_days, n_tickets_60, delay_ratio_mean, recency_prev_days.
- Calcul : 28 min d'étapes chronométrées (5 cœurs, machine partagée : les durées varient beaucoup avec la charge) ; sous-échantillon de recherche 40 000 clients ; 19 jumeaux log retirés, 170 colonnes après one-hot.

## Figures (message)
- `figures/04_rf_reglage.png` : Forêt aléatoire : des feuilles plus grosses et plus d'arbres améliorent l'AUC, qui plafonne vers 100 arbres (AUC pli 0 : 0,8771)
- `figures/04_gbm_grille_fine.png` : Grid search fin sur le sous-échantillon : taille des arbres et des feuilles comptent peu autour de l'optimum, la vitesse d'apprentissage un peu plus
- `figures/04_courbes_iterations.png` : Sur-apprentissage : l'AUC d'entraînement continue de monter, celle de validation plafonne puis redescend ; un pas plus petit demande plus d'arbres pour un plateau à peine plus haut
- `figures/04_courbes_parametres.png` : Des arbres plus complexes (plus de feuilles, feuilles plus petites) collent mieux à l'entraînement sans rien gagner en validation : le réglage se joue sur un plateau
- `figures/04_desequilibre.png` : Pondérer les rachats ne change presque pas le classement (AUC) mais détériore le log-loss : les scores gonflés ne sont plus des probabilités
- `figures/04_ablation_familles.png` : Une seule famille compte vraiment : sans « Saisonnalité », l'AUC baisse de 0,0064 ; les 9 autres familles coûtent chacune 0,0005 ou moins ; sans le profil d'identité : −0,0002
- `figures/04_auc_par_pli.png` : Les modèles réglés sont stables : l'AUC varie de 0,8757 à 0,8818 selon le pli pour lgbm_tuned, moins que l'écart avec la règle de récence
- `figures/04_roc_gain.png` : En ciblant 10 % de la base, lgbm_tuned capte 52,6 % des rachats contre 30,4 % pour la règle de récence
- `figures/04_calibration.png` : Calibration par déciles de score : les modèles réglés suivent la diagonale ; les versions pondérées surestiment fortement (score moyen 3,9 fois le taux réel pour LightGBM) et les modèles non réglés sont un peu trop tranchés
- `figures/04_temps_entrainement.png` : Le LightGBM réglé s'entraîne en 2,2 s par pli ; la forêt réglée met 9,1 fois plus de temps pour une AUC plus basse
- `figures/04_importance_variables.png` : Le gain se concentre sur « Fréquence » et « Récence » (69 %), mais la permutation place share_weekend (« Saisonnalité ») devant recency_days et n_tickets_60
- `figures/04_dependance_partielle.png` : Dépendance partielle : share_weekend fait passer la probabilité moyenne prédite de 4,2 % à 12,7 % ; les courbes brutes (gris) sont plus raides que celles du modèle, car récence, fréquence et rythme se partagent l'effet

## Décisions méthodologiques
- Mêmes 5 plis pour tous les modèles ; test = moyenne des 5 modèles de pli ; le test ne sert à aucune décision. Réglage : random search (30 configurations GBM, 18 forêt) puis grid fin (slide 69), sur un sous-échantillon stratifié de 40 000 clients (3 plis internes) ; pas d'optimisation bayésienne ni de stacking.
- 19 jumeaux `log_*` retirés (arbres invariants aux transformations monotones : AUC 0,8785 sans vs 0,8785 avec). One-hot N − 1 des 6 qualitatives pour tous les modèles ; manquants natifs pour XGBoost / LightGBM, médiane + indicateurs pour la forêt.
- Nombre d'arbres du boosting fixé par arrêt anticipé sur le pli 0 puis figé dans la CV ; courbes de validation pour montrer sur-apprentissage et plateau.
- Soumission écrite pour le meilleur modèle de ce notebook seulement, non envoyée à Kaggle ; choix final au notebook 06.

## Anomalies et points de vigilance
- La part d'achats le week-end (famille Saisonnalité) pèse beaucoup ; août 2020 commence un samedi et compte 10 jours de week-end : effet de calendrier possible, non testable avec un seul mois cible.
- Le réglage (même léger) utilise les mêmes plis que l'évaluation : AUC hors-échantillon légèrement optimiste ; sous-échantillon de recherche tiré dans tous les plis.
- Les scores sont des classements : cible plus étroite que « acheter dans le mois » ; la pondération des rachats détériore encore la calibration.
- Profil d'identité (e-mail, département, civilité) : coût d'AUC −0,0002 en le retirant ; risque de proxy d'âge et de territoire (RGPD, discrimination indirecte).

## Limites et pistes (phase d'optimisation Kaggle)
- Catégories natives de LightGBM ; nouvelles fenêtres (3 et 10 jours, décroissances exponentielles) et ratios ; cibles décalées / multi-coupures ; open data INSEE, calendrier, météo.
- Plus d'essais de réglage, graines multiples, validation imbriquée ou temporelle ; SHAP et profil du racheteur au notebook 06.
