# Résumé du notebook 06 : modèle final, évaluation business et interprétation

## Chiffres clés (train, 5 plis communs, hors-échantillon ; top 10 % = les 10 % de clients au meilleur score)
- **Modèle final : `lgbm_tuned`** (LightGBM réglé, hyperparamètres de `results/04_best_params.json`, 170 colonnes). Ré-entraînement fidèle : AUC 0,8785 (écart avec le notebook 04 : 0e+00) ; AUC par pli 0,8757 à 0,8818, écart-type 0,0022 ; IC 95 % bootstrap [0,8759 ; 0,8816].
- Référence interprétable : `logreg_lasso`, AUC 0,8714 ; le modèle final gagne 5/5 plis (+0,0072 d'AUC). Contre XGBoost réglé (+0,0006) la différence est dans le bruit. Récence seule : AUC 0,8180.
- **Top 10 % (16 042 clients)** : précision 40,6 %, rappel 52,6 %, lift 5,26 (Lasso : 39,3 % / 50,9 % ; récence : 23,5 % / 30,4 %). Taux de rachat du 1er décile 40,6 %, du dernier 0,3 % (base 7,7 %).
- Calibration : score moyen = 1,00 × taux réel, pente 1,01, écart par décile 0,07 pt ; on ne s'intéresse qu'au classement (cible plus étroite que « acheter dans le mois »).
- Parmi le top 10 %, 36 % n'ont pas d'e-mail (injoignables par ce canal).
- SHAP (10 000 clients, explications hors-pli, additivité vérifiée à 1e-14) : 5 premières variables = `share_weekend`, `recency_prev_days`, `n_tickets_60`, `recency_days`, `n_tickets_180`, 44 % de l'importance. Accord avec les odds ratios du notebook 03 : même sens sur 14/15 variables comparables, corrélation de rang 0,47.
- Profil du racheteur : dernier achat il y a 15 j (autres : 107 j), 11,4 tickets sur 60 j (autres : 2,4), 32 % d'achats le week-end (autres : 25 %).
- Risque calendrier : sans `share_weekend` et `share_saturday`, AUC 0,8728 (perte 0,0058) ; août 2020 : 32,3 % de jours de week-end contre 29,0 % en août 2019.

## Fichiers produits
- `submissions/06_final.csv` (non envoyé à Kaggle) ; prédictions `final_lgbm` ; `results/06_best_model.json` (copie : `results/best_model.json`), `06_model_selection.csv`, `06_deciles.csv`, `06_topk_metrics.csv`, `06_calibration.csv`, `06_shap_importance.csv`, `06_shap_dependance.csv`, `06_client_examples.csv`, `06_profil_racheteur.csv`, `06_robustesse_plis.csv`, `06_calendrier_mois.csv`, `06_rachat_selon_weekend.csv`, `06_diagnostic_calendrier.json`, `06_key_numbers.json`.

## Figures (message)
- `figures/06_choix_modele.png` : LightGBM réglé est en tête (AUC 0,8785) : il capte 52,6 % des racheteurs dans le top 10 %, contre 50,9 % pour le Lasso et 30,4 % pour la seule récence
- `figures/06_roc_gain_lift.png` : En ciblant 10 % de la base, le modèle final capte 52,6 % des racheteurs (lift 5,26), contre 50,9 % pour le Lasso et 30,4 % pour la récence seule
- `figures/06_deciles.png` : Le premier décile rachète à 40,6 % (lift 5,26) et concentre 52,6 % des racheteurs ; les cinq derniers déciles n'en contiennent que 5 %
- `figures/06_calibration.png` : Les scores suivent la diagonale : score moyen = 1,00 fois le taux réel, pente de recalibrage 1,01, écart moyen 0,07 point par décile
- `figures/06_shap_resume.png` : Cinq variables portent 44 % de l'importance SHAP, en tête « Part des achats le week-end », « Jours depuis l'avant-dernier achat » et « Tickets sur 60 jours » ; chaque point est un client, orange = valeur élevée de la variable
- `figures/06_shap_vs_odds_ratios.png` : SHAP et odds ratios donnent le même sens d'effet pour 14 variables sur 15 comparables parmi les 15 premières ; l'ordre d'importance ne concorde que partiellement (corrélation des rangs 0,47 sur 44 variables communes)
- `figures/06_shap_dependance.png` : Les effets sont non linéaires et plafonnent : la pénalité de récence s'arrête vers 150 jours sans achat, le nombre de tickets agit en courbe concave, la part d'achats le week-end monte jusqu'à environ 40 % puis se stabilise (courbe orange = moyenne par vingtile)
- `figures/06_shap_clients.png` : Trois clients types : le « très probable » (66 %) est tiré par « Tickets sur 60 jours », celui du seuil du top 10 % est tiré par « Part des achats le week-end », le « peu probable » (2 %) est freiné par « Part des achats le week-end »
- `figures/06_profil_racheteur.png` : Le racheteur d'août est passé il y a 15 jours en moyenne (contre 107), a 11,4 tickets sur 60 jours (contre 2,4) et fait 32 % de ses achats le week-end (contre 25 %)
- `figures/06_risque_calendrier.png` : Sans les variables week-end, l'AUC ne perd que 58 points sur 10 000 (0,8728 contre 0,8785), mais août 2020 compte 32 % de jours de week-end contre 29 % en août 2019 : un effet de calendrier ne peut pas être exclu

## Décisions méthodologiques
- Modèle final = meilleur AUC hors-échantillon (LightGBM réglé), non pas par supériorité nette sur XGBoost mais par performance, vitesse et SHAP exact ; Lasso gardé comme référence lisible. Mêmes variables que le notebook 04 (profil d'identité conservé pour rester comparable).
- Test = moyenne des 5 modèles de pli (pas de ré-ajustement) ; le test ne sert à aucune décision. SHAP : 2 000 clients par pli de validation, expliqués par le modèle du pli, one-hot additionné par variable.

## Anomalies et limites
- **`share_weekend` : risque d'effet de calendrier non tranché** (un seul mois cible ; août 2020 commence un samedi, 10 jours de week-end). Acceptable pour le test Kaggle (même mois), à ne pas extrapoler à un déploiement mensuel sans multi-coupures.
- AUC légèrement optimiste (réglage sur les mêmes plis) ; un seul mois, plis aléatoires. Score prédictif ≠ effet incrémental (test A/B au notebook 07). Profil d'identité : proxy possible d'âge et de territoire.
- Odds ratios du notebook 03 : 49 variables publiées seulement ; la comparaison SHAP / odds ratios ne porte que sur celles-ci.

## Pistes
- Multi-coupures et graines multiples pour mesurer le calendrier et la variance ; version sans variables de jour de semaine comme garde-fou ; catégories natives LightGBM ; open data ; suivi de dérive.
