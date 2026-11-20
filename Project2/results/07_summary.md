# Résumé du notebook 07 : recommandations marketing (usage du score, segment Good, scénarios, test A/B)

## Chiffres clés (train, 5 plis communs, hors-échantillon ; 🟦 = mesuré, 🟧 = supposé)
- 🟦 **Top 10 % par score `lgbm_tuned`** (16 042 clients sur le train, 20 053 sur la base complète) : précision 40,6 %, rappel 52,6 %, lift 5,26 ; hasard : 7,7 % ; règle de récence : 23,5 % ; score RFM : 32,7 % ; logistique Lasso : 39,3 %.
- 🟦 **Rachats captés en plus du hasard** : +5 282 (IC95 5 178 à 5 399), soit +2 755 face à la récence. « Captés » n'est pas « provoqués ».
- 🟦 **Joignabilité** : 64 % du top 10 % a un e-mail ; en choisissant les 10 % parmi les e-mailables : précision 32,3 %.
- 🟦 **Composition du top 10 %** : 96 % Top, 1,5 % Good ; Good : 36 % de ses clients dans le top 30 %.
- 🟦 **Good** : 30 307 clients (base complète), 17 486 e-mailables, rachat 6,5 %, AUC intra-segment 0,677 ; rachat par tranche de score : A (20 % haut) 13,4 %, B 6,9 %, C (50 % bas) 3,6 %.
- 🟧 **Scénario central** (contact 0,02 €, marge 25 %, remise 10 %, utilisation 30 %) : avec une remise de 10 %, **aucune stratégie n'est rentable au centre** (marge nette à +1 pt / +10 % : tout Good -0,2 / -0,9 k€ ; hasard -0,9 / -1,2 ; top 10 % par score -8,5 / -3,2 k€) ; en scénario haut (+2 pts / +20 %) : tout Good 1,9 / 0,6, top 10 % par score -6,1 / 4,5 k€.
- 🟧 **Seuil de rentabilité** (remise 10 %) : tout Good +1,11 point ; Good 50 % haut du score +1,49 ; hasard +1,37 ; top 10 % par score +4,57 point (≈ +14 % en relatif). Avec remise de 5 % : tout Good +0,60 ; rappel sans remise : +0,14 point (uplift d'un rappel inconnu).
- 🟧 **Le ciblage par score ne bat le hasard que si l'uplift croît avec la propension** (uplift relatif ≥ ~14 %) ; à uplift identique pour tous, il est moins rentable (la remise va à des acheteurs naturels). Dans Good, trier par score n'améliore pas la marge à uplift identique.
- 🟦/🟧 **Test A/B** : tous les e-mailables de Good (17 486), 30 % de témoins, α 5 %, puissance 80 % : effet minimal détectable 1,22 point ; 25 777 clients requis pour 1 point.

## Figures (message)
- `07_ciblage_top10` : avec 10 % de la base, le score capte 53 % des racheteurs contre 30 % pour la récence.
- `07_segments_scores` : le top 10 % est occupé par Top ; Good étale ses scores de part et d'autre du seuil du top 30 %.
- `07_good_leviers` : dans Good, le rachat monte avec la régularité, le rythme court et le week-end ; Good achète surtout vendredi-samedi.
- `07_scenarios_roi` : le ciblage par score n'est supérieur que si l'uplift augmente avec la propension ; sinon la remise distribuée aux acheteurs naturels pèse.
- `07_sensibilite_remise` : marge nette de Good 50 % haut du score selon uplift et remise supposés : à 10 % de remise il faut ≥ 1,5 point d'uplift, à 5 % ≥ 0,8.
- `07_ab_dimensionnement` : sous 1,3 point d'uplift, il faut plus de clients que Good n'en compte.

## Décisions et recommandations
- **Segment confirmé : Good**, avec nuances : ce n'est pas le segment qui capte le plus de rachats (Top, 96 % du top 10 %) ni la plus grande marge brute ; c'est un pari « incrémental » par hypothèse (clients moins saturés), à vérifier par A/B. Le score classe les clients dans Good (AUC intra 0,68, tranches A/B/C de 13 % à 4 % de rachat) mais ne dit pas qui réagit : tester tout Good, lire par tranche. Second choix C3 Montants (recoupe Top et Good).
- **Message** : « prochain panier du week-end », relance avant le basculement vers Decel (60 jours), déclenchement au rythme du client, envoi jeudi/vendredi matin, variante sans remise ; **canal** e-mail ; calendrier J − 14 à J + 60.
- **Plan en 3 étapes** : préparer (randomisation 70/30 stratifiée, seuil de rentabilité) ; tester 4 semaines (+ suivi 60 jours) ; décider (uplift ≥ seuil, pas d'achat avancé) et ré-entraîner.

## Anomalies et limites
- Les scénarios en € reposent sur des hypothèses 🟧 (coût de contact, marge, remise, utilisation, uplift) ; ils ne sont pas des prévisions. Le classement entre stratégies dépend du modèle d'uplift (identique pour tous ou proportionnel au taux de base).
- Propension ≠ effet causal : le top 10 % est composé de clients qui achètent déjà très souvent (part « acquise » inconnue sans témoin) ; aucune donnée de campagne passée ; cible étroite (~1,9 jour d'activité) ; un seul mois (août 2020, calendrier favorable au week-end).
- Les clients non joignables par e-mail (45 %) sont hors cible de l'e-mail ; les e-mailables rachètent plus (sélection).
- Le score utilisé est `lgbm_tuned` (notebook 04) ; le modèle final du notebook 06 s'y substituera en changeant `MODEL`.

## Pistes
- Modèle d'uplift après le premier test ; plusieurs coupures ; données ouvertes ; canal hors e-mail ; mesure de la pression marketing ; plusieurs vagues pour gagner en puissance.