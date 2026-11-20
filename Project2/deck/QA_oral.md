# Projet 2 : préparation aux questions du jury (oral du mercredi 25/11/2026)

Jury : Anna Blanpied / AVISIA. Oral de 15 min, puis questions. Ce document sert à répondre **sans avoir suivi le détail du travail**.

Conventions : les fichiers cités sont dans `Project2/results/` (ex. « 06_key_numbers.json » = `results/06_key_numbers.json`). Chaque réponse est à dire à voix haute, telle quelle ou presque. **Aucun score Kaggle n'est connu** : si on vous le demande, voir la question 30.

---

## 0. Cinq réflexes avant de répondre

1. **Commencer par la réponse**, puis un chiffre, puis stop. Deux à quatre phrases suffisent.
2. **Ne jamais défendre l'indéfendable** : quand la question touche une faiblesse (week-end, rentabilité, un seul mois), reprendre la formulation de la section 2 et enchaîner sur « et voici comment on le vérifierait ».
3. **Propension n'est pas effet causal.** Dès qu'on parle d'euros ou de rentabilité, le dire.
4. **Les scénarios en euros sont des hypothèses**, jamais des prévisions. Dire « hypothèse » à voix haute.
5. **Si on ne sait pas** : « Ce point n'a pas été testé ; ce qu'on sait, c'est… ; ce qu'on ferait, c'est… ».

---

## 1. Les 30 questions probables

### A. Données et nettoyage

**Q1. Que contient la base, et qu'avez-vous nettoyé ?**
> Nous avons 160 424 clients en apprentissage (3,29 millions de tickets, du 01/08/2019 au 31/07/2020) et 40 106 clients en test. Le principal nettoyage : un ticket est un couple (client, instant), car les paiements fractionnés créent plusieurs lignes ; 5 742 lignes ont été regroupées sans perdre les montants. Les retours (0,21 % des tickets) sont gardés avec un drapeau et exclus de la récence, de la fréquence et du panier ; les codes postaux à 4 chiffres sont des adresses suisses ou belges, classées « étranger ».

Sources : 01_summary.md, 01_key_numbers.json, 01_cleaning_decisions.csv.

**Q2. Comment traitez-vous les valeurs manquantes et extrêmes ?**
> Les manquants sont structurels (un client à un seul ticket n'a pas d'intervalle entre achats) : on ne les impute pas statistiquement, on les code « inconnu » ou NaN avec un indicateur. Les extrêmes sont plafonnés au 99,9e percentile (panier 469 €, 338 tickets par client) puis passés en logarithme ; nous n'avons supprimé aucun client, car les très gros clients rachètent à 69 % au-delà de 300 tickets. C'est la méthode du cours : plafonnement des aberrantes, imputation par règle métier.

Sources : 01_summary.md (décisions méthodologiques), 02_summary.md.

**Q3. 45 % des clients n'ont pas d'e-mail : est-ce un problème pour le ciblage ?**
> Oui, c'est une contrainte opérationnelle que nous avons chiffrée : 45,3 % des clients sont injoignables par e-mail, et 36 % du top 10 % du score est dans ce cas. Si l'on choisit les 10 % uniquement parmi les e-mailables, la précision tombe de 40,6 % à 32,3 %, ce qui reste bien au-dessus du hasard parmi eux (8,8 %). Notre plan d'action se limite donc au canal e-mail et suggère un canal hors e-mail comme piste.

Sources : 01_summary.md, 06_key_numbers.json (top10_share_no_email), 07_ciblage_top10.csv.

### B. Construction de la cible et fuite temporelle

**Q4. Comment avez-vous construit la cible, et comment évitez-vous la fuite temporelle ?**
> La cible vaut 1 si le client achète en août 2020 ; les fichiers s'arrêtent au 31/07/2020, donc aucune ligne d'août n'est présente. Toutes les variables sont calculées uniquement avec les tickets antérieurs au 1er août ; la cible ne sert jamais à fabriquer une variable ; les plafonds sont appris sur le train puis appliqués au test ; le test ne sert à aucune décision. Train et test se ressemblent (écart de distribution KS ≤ 0,005 sur les variables brutes), et les 5 plis ont le même taux de rachat à 0,003 point près.

Sources : 02_summary.md (décisions), 01_summary.md, 01_train_vs_test.csv, 01_rachat_par_pli.csv.

**Q5. Votre taux de rachat est de 7,7 % alors que la plupart des clients rachètent chaque mois. Pourquoi ?**
> C'est une anomalie que nous avons repérée dès le début : historiquement 62 à 80 % des clients actifs un mois rachètent le suivant, mais seulement 16 % des acheteurs de juillet rachètent en août. Les 7,7 % équivalent à environ 1,9 jour d'activité : la cible est plus étroite que « acheter dans le mois ». Conséquence assumée : seul le classement compte, on ne lit pas les scores comme des taux mensuels, et la fenêtre exacte de la cible est à vérifier avec l'enseignante.

Sources : 01_summary.md (anomalies), 01_key_numbers.json (persist_min/max, persist_aug, k_eq_days).

### C. Variables

**Q6. Quelles variables avez-vous construites, et pourquoi ?**
> Une centaine de variables par client, décrit « en photo » au 1er août sur plusieurs fenêtres glissantes, en dix familles : Récence (4), Fréquence (15), Montant (15), Rythme et tendance (20), Saisonnalité (10), Promotions et retours (10), Paiement (6), Segment de prix (2), Magasins (7), Profil client (11). Ce sont des variables comportementales et transactionnelles, comme le cours le recommande pour un score de rachat ; on a retiré 17 quasi-doublons (corrélation > 0,95) sans regarder la cible.

Sources : 02_summary.md, 02_feature_dictionary.csv.

**Q7. Qu'est-ce qui compte vraiment parmi ces variables ?**
> La récence et la fréquence : elles portent 68 à 69 % du gain du modèle, et la meilleure variable seule (tickets sur 90 jours) atteint déjà 0,852 d'AUC, contre moins de 0,65 pour paiement, segment de prix, magasins ou profil. L'ablation par famille confirme : retirer une famille coûte au plus 0,0005 d'AUC, sauf la Saisonnalité (−0,0064), dominée par la part d'achats le week-end. Les familles se compensent entre elles, donc un faible coût d'ablation ne veut pas dire « inutile ».

Sources : 02_summary.md, 04_ablation_familles.csv, 04_summary.md.

**Q8. Vous utilisez e-mail, département, civilité : est-ce acceptable ?**
> Le profil d'identité apporte presque rien : sans lui, l'AUC passe de 0,8785 à 0,8783. Nous l'avons gardé seulement pour rester comparable entre notebooks ; il peut être retiré sans coût, ce qui est préférable car il peut servir de proxy d'âge ou de territoire (risque de discrimination indirecte, RGPD). Nous le signalons comme point de vigilance dans l'analyse.

Sources : 04_summary.md (anomalies), 06_model_selection.csv (lgbm_no_profile).

### D. Choix des modèles et validation croisée

**Q9. Pourquoi cette progression de modèles ?**
> Nous avons suivi le cours du plus simple au plus riche, chaque étape devant justifier son gain. En AUC : récence seule 0,818 ; score RFM 0,841 ; régression logistique Lasso 0,871 ; arbre 0,864 ; k plus proches voisins 0,863 ; Naive Bayes 0,859 ; forêt aléatoire réglée 0,875 ; XGBoost réglé 0,878 ; LightGBM réglé 0,8785. Le saut important est de la récence au Lasso (+0,053) ; le suivant, du Lasso au boosting, est plus modeste (+0,007).

Sources : 03_model_comparison.csv, 04_model_comparison.csv, 06_model_selection.csv.

**Q10. Pourquoi LightGBM et pas XGBoost ou le Lasso, plus lisible ?**
> Honnêtement, LightGBM et XGBoost sont à égalité : 0,8785 contre 0,8779, une différence de 0,0006 très inférieure à l'écart-type entre plis (0,0022). Nous retenons LightGBM sur le meilleur AUC, la vitesse (2,2 s par pli, 9 fois moins qu'une forêt réglée) et SHAP exact. Il bat le Lasso sur les 5 plis (+0,0072) ; le Lasso reste notre référence interprétable, avec 44 coefficients non nuls sur 165.

Sources : 06_summary.md, 06_model_selection.csv, 04_summary.md, 03_summary.md.

**Q11. Pourquoi une validation croisée, et votre AUC n'est-elle pas optimiste ?**
> Avec 12 392 racheteurs seulement, une validation croisée stratifiée à 5 plis, communs à tous les modèles, est plus fiable qu'un seul découpage ; l'AUC par pli va de 0,8757 à 0,8818 (écart-type 0,0022, intervalle bootstrap 95 % : 0,8759 à 0,8816). Le réglage des hyperparamètres s'est fait sur un sous-échantillon de 40 000 clients tiré dans tous les plis, donc l'estimation est légèrement optimiste. Mais le réglage entier n'apporte que +0,0021 d'AUC (LightGBM non réglé : 0,8764), ce qui borne cet optimisme.

Sources : 06_robustesse_plis.csv, 06_key_numbers.json, 04_summary.md (anomalies), 04_model_comparison.csv.

**Q12. Les rachats sont rares (7,7 %) : avez-vous rééquilibré les classes ?**
> Nous avons testé la pondération des rachats, mais elle ne change presque rien au classement (AUC 0,8776 contre 0,8785) et détériore les probabilités : log-loss 0,418 contre 0,190, le score moyen devient 3,9 fois le taux réel. Sans pondération, le modèle est calibré (score moyen = 1,00 fois le taux réel, pente 1,01). Nous gardons donc le modèle non pondéré.

Sources : 04_desequilibre.csv, 06_key_numbers.json.

### E. AUC, précision, rappel, lift, et la contrainte des 10 %

**Q13. Pourquoi l'AUC comme critère principal ?**
> C'est la métrique de la compétition, et surtout elle mesure la qualité du classement sans fixer de seuil : c'est la probabilité qu'un racheteur tiré au hasard ait un meilleur score qu'un non-racheteur. Notre besoin réel est de classer puis de couper à 10 %, donc le classement est ce qui compte. On la complète par le log-loss (0,1897), la calibration et les indicateurs du top 10 %.

Sources : 06_best_model.json, 06_key_numbers.json.

**Q14. Que signifient précision 40,6 %, rappel 52,6 % et lift 5,26 ?**
> En ciblant les 10 % de clients au meilleur score (16 042 clients), 40,6 % rachètent réellement (précision) ; ces clients contiennent 52,6 % de tous les racheteurs du mois (rappel) ; et la précision est 5,26 fois le taux moyen de 7,7 % (lift). La seule règle de récence donne 23,5 % de précision et 30,4 % de rappel : le modèle capte donc 22 points de racheteurs de plus. Au total 6 521 racheteurs sont captés contre environ 1 240 au hasard.

Sources : 06_key_numbers.json (top10_*, TP = 6 521), 07_ciblage_top10.csv.

**Q15. Pourquoi 10 % ? Pourquoi pas optimiser un seuil ou le F1 ?**
> Le 10 % est une contrainte du marketing, pas un choix statistique : le budget d'envoi est fixé, donc il n'y a pas de seuil à optimiser, seulement un classement à couper. Pour information, à 5 % la précision monte à 53,2 % (rappel 34,5 %), à 20 % elle tombe à 28,3 % (rappel 73,3 %). Le F1 n'a pas de sens ici puisque le volume est imposé.

Sources : 06_topk_metrics.csv, BRIEF_COMMUN.md (§1).

### F. Interprétation : SHAP et odds ratios

**Q16. Que dit SHAP, et en quoi diffère-t-il des odds ratios ?**
> SHAP, calculé sur 10 000 clients hors-pli, décompose chaque score en contributions par variable : les cinq premières (part d'achats le week-end, jours depuis l'avant-dernier achat, tickets sur 60 jours, jours depuis le dernier achat, tickets sur 180 jours) font 44 % de l'importance. Les odds ratios du Lasso sont un effet moyen linéaire ; SHAP montre les non-linéarités, par exemple la pénalité de récence qui s'arrête vers 150 jours sans achat. Les deux méthodes concordent sur le sens pour 14 variables sur 15 ; la corrélation de rang n'est que de 0,47, donc on ne compare pas les ordres.

Sources : 06_summary.md, 06_key_numbers.json, 06_shap_importance.csv, 06_shap_dependance.csv.

**Q17. Comment lit-on concrètement un odds ratio ici ?**
> Les variables sont standardisées, donc l'odds ratio se lit « pour une hausse d'un écart-type ». Par exemple une hausse d'un écart-type de la part d'achats le week-end multiplie la cote de rachat par 1,79 (IC 95 % : 1,74 à 1,85), et un écart-type de récence en plus (110 jours) divise la cote par 1,40. Attention : les variables de comptage sont très corrélées (jusqu'à 0,92), on les lit ensemble et non une par une.

Sources : 03_odds_ratios.csv, 03_summary.md (anomalies).

### G. Calendrier et effet week-end

**Q18. Pourquoi la part d'achats le week-end est-elle la variable n°1 ? N'est-ce pas suspect ?**
> C'est le point que nous signalons nous-mêmes : sans les variables week-end, l'AUC ne perd que 0,0058 (0,8728), mais août 2020 commence un samedi et compte 10 jours de week-end sur 31 (32,3 %), contre 29,0 % en août 2019 et 28,4 % en moyenne sur 12 mois. Comme nous n'avons qu'un seul mois cible, nous ne pouvons pas distinguer un vrai comportement d'un effet de calendrier. Les deux scores restent très proches (corrélation 0,984).

Sources : 06_diagnostic_calendrier.json, 06_calendrier_mois.csv, 06_summary.md.

**Q19. Comment trancheriez-vous ?**
> Il faudrait plusieurs coupures : reconstruire la cible sur d'autres mois passés et vérifier que l'effet week-end tient. En attendant, nous recommandons un garde-fou : une version du modèle sans variables week-end, qui coûte 0,0058 d'AUC. Pour le test Kaggle (même mois, même calendrier), garder la variable est acceptable ; pour un déploiement mensuel, non sans validation.

Sources : 06_summary.md (pistes), 06_diagnostic_calendrier.json.

Note pour vous : le lien entre le rachat et la part de week-end n'est pas monotone (13,0 % de rachat pour 30 à 45 % de week-end, 6,5 % au-delà de 60 % pour l'ensemble des clients) (06_rachat_selon_weekend.csv). Ne pas dire « plus on achète le week-end, plus on rachète ».

### H. Segmentation RFM et clustering

**Q20. Comment avez-vous construit la segmentation RFM ?**
> Nous avons appliqué la règle du cours avec des seuils métier : d'abord Inactive (plus de 180 jours sans achat) et New (premier ticket il y a moins de 90 jours), puis récence (≤ 14 jours, 15 à 60, 61 à 180), fréquence (≤ 5, 6 à 24, ≥ 25 tickets) et montant (≤ 150 €, 151 à 1 000 €, > 1 000 €), soit 27 combinaisons regroupées en 7 segments. Top représente 28 % des clients, 68 % du chiffre d'affaires et 76 % des rachats, avec 21,2 % de rachat. Les seuils par tertiles donnent les mêmes étiquettes pour 81 % des clients : nous gardons les seuils métier, plus lisibles.

Sources : 05_summary.md, 05_segment_definitions.json.

**Q21. Le clustering est-il convaincant ? La silhouette est faible.**
> Non, et nous le disons : silhouette de 0,17, sans coude net, donc les classes découpent un continuum plutôt que des groupes naturels. Nous avons retenu k = 6 pour l'interprétation (stabilité ARI 0,97 en K-Means, mais 0,34 entre CAH et K-Means). Le clustering sert à enrichir la lecture (Réguliers 20,2 % de rachat, Petits paniers 1,3 %), pas à prédire : l'AUC des 6 classes est de 0,781 contre 0,818 pour la récence seule.

Sources : 05_summary.md, 05_cluster_profiles.csv.

### I. Choix du segment « Good »

**Q22. Good rachète à 6,5 %, moins que la moyenne (7,7 %). Pourquoi ce segment ?**
> Nous ne l'avons pas choisi pour son taux mais pour son potentiel incrémental : c'est un pari que nous assumons et que le test A/B doit vérifier. Nous avions fixé les critères avant le classement : taille suffisante pour un test, pas déjà acquis, rachat d'au moins 3 %, joignable par e-mail, valeur, potentiel de réveil. Good est le seul segment à satisfaire les 7 critères : 30 307 clients (17 486 joignables), 17 % du chiffre d'affaires, 13 % des rachats, dernier achat médian il y a 29 jours.

Sources : 05_candidate_segments.csv (criteria_met), 07_key_numbers.json, 07_good_persona.csv.

**Q23. Pourquoi pas Top, qui rachète à 21 % ?**
> Parce que Top est déjà acquis : 28 % des clients, 76 % des rachats, et 96 % du top 10 % du score en vient. Lui envoyer une remise revient à la donner à des acheteurs qui reviendraient de toute façon ; il est éliminé par le critère « pas déjà acquis ». Le second choix était la classe C3 Montants (9,8 % de rachat), qui ne remplit que 4 critères sur 7 et recoupe Top et Good.

Sources : 05_candidate_segments.csv, 07_key_numbers.json (part_top_dans_top10 = 0,957), 05_summary.md.

### J. Propension, effet causal et test A/B

**Q24. Cibler les plus probables, est-ce cibler les plus influençables ?**
> Non, et c'est notre principale réserve : le score mesure qui va probablement racheter, pas qui rachètera grâce à l'e-mail. Le top 10 % capte 5 282 racheteurs de plus que le hasard (IC 95 % : 5 178 à 5 399), mais « captés » ne veut pas dire « provoqués ». Nous n'avons aucune donnée de campagne passée ; seul un test A/B avec un groupe témoin mesure l'effet incrémental, d'où notre recommandation.

Sources : 07_key_numbers.json, 07_summary.md (anomalies).

**Q25. Comment dimensionnez-vous le test A/B ?**
> Nous testons tous les e-mailables de Good (17 486) avec 30 % de témoins, un risque de 5 % et une puissance de 80 % : l'effet minimal détectable est de 1,22 point de rachat, soit environ 18 % en relatif. Pour détecter 1 point il faudrait environ 25 800 clients, plus que Good n'en contient ; pour 1,5 point, environ 11 800 suffisent. On suit quatre semaines puis 60 jours pour détecter des achats simplement avancés, et on lit les résultats par tranche de score.

Sources : 07_ab_mde.csv, 07_ab_dimensionnement.csv, 07_key_numbers.json.

### K. Scénarios économiques et hypothèses

**Q26. Combien la campagne rapporte-t-elle ?**
> Nous ne promettons pas de gain : avec nos hypothèses centrales (hypothèses, pas des mesures), aucune stratégie n'est rentable. Par exemple, marge nette de l'ordre de −0,2 à −0,9 k€ en ciblant tout Good, et de −8,5 à −3,2 k€ pour le top 10 % du score. Ce qui compte est le seuil de rentabilité : avec une remise de 10 %, il faut un gain de rachat de +1,11 point sur tout Good, +1,49 point sur la moitié haute du score de Good, et +4,57 points sur le top 10 %. Avec une remise de 5 %, le seuil sur tout Good tombe à +0,60 point ; sans remise, à environ +0,14 point.

Sources : 07_key_numbers.json (net_k_eur, seuils), 07_scenarios_economiques.csv, 07_summary.md.

Réflexe : si on vous demande « alors à quoi sert le modèle ? », répondre que le modèle classe bien (précision 40,6 %), mais que la valeur de la campagne dépend de l'uplift ; le score ne bat le hasard en rentabilité que si l'uplift croît avec la propension (au moins environ 14 % en relatif).

**Q27. D'où viennent vos hypothèses (marge, remise, utilisation) ?**
> Elles ne viennent pas des données : ce sont des hypothèses étiquetées comme telles, et c'est ce qui rend les scénarios non prédictifs. Nous avons pris un coût de contact de 0,02 €, une marge de 25 %, une remise de 10 % utilisée par 30 % des clients, et un gain de rachat de +1 point (bas 0,5, haut 2) ou de +10 % en relatif (bas 5, haut 20). Ce qui est mesuré : taux de rachat, panier moyen et effectifs. Les vraies marges et remises de l'enseigne remplaceraient ces valeurs.

Sources : 07_hypotheses.json, 07_summary.md.

### L. Limites

**Q28. Quelles sont les principales limites de votre travail ?**
> Cinq : un seul mois cible, donc pas de saisonnalité apprenable et un risque de calendrier ; une cible étroite (environ 1,9 jour d'activité) ; des plis aléatoires et non chronologiques avec un réglage sur les mêmes plis ; des scores de propension et non d'effet causal ; des scénarios en euros reposant sur des hypothèses. S'y ajoutent 45 % de clients injoignables par e-mail et un clustering à silhouette faible. Pour chacune, nous avons une piste (multi-coupures, A/B, validation temporelle).

Sources : 01_summary.md, 04_summary.md, 06_summary.md, 07_summary.md (limites).

### M. Hors cours et phase Kaggle

**Q29. Pourquoi pas de stacking, de réseaux de neurones ou d'optimisation bayésienne ?**
> Nous nous sommes volontairement limités à la méthode du cours : régression logistique et pénalisée, arbre, forêt, XGBoost et LightGBM, avec grid et random search, SHAP. Stacking, réseaux de neurones, encodages par la cible, multi-coupures et Optuna sont réservés à la phase d'optimisation Kaggle, qui vient après. Le SVM n'a pas été entraîné à cause du coût sur 160 000 lignes ; nous n'avons utilisé aucune donnée externe.

Sources : BRIEF_COMMUN.md (§3), 03_summary.md, 04_summary.md.

**Q30. Quel score attendez-vous sur Kaggle ?**
> Nous ne le connaissons pas encore et nous ne voulons pas le prédire. Ce que nous avons, c'est une AUC de validation croisée de 0,8785 sur le train, estimée légèrement optimiste, et un test de même distribution que le train. L'écart éventuel entre les deux nous dira surtout si l'effet de calendrier ou le réglage nous ont surestimés.

Sources : 06_best_model.json, 01_train_vs_test.csv. L'emplacement prévu sur la slide 14 est `[score Kaggle à insérer]`.

---

## 2. Nos 5 faiblesses assumées (et comment les annoncer)

| # | Faiblesse | Formulation honnête (à dire) |
|---|---|---|
| 1 | **Un seul mois cible : effet de calendrier week-end non tranché** | « Notre variable la plus importante est la part d'achats le week-end. Août 2020 commence un samedi et compte 10 jours de week-end sur 31, contre 29 % en août 2019. Avec un seul mois cible, nous ne pouvons pas exclure un effet de calendrier ; sans ces variables, l'AUC passe de 0,8785 à 0,8728. Nous le signalons et nous proposons des multi-coupures pour le trancher. » |
| 2 | **Le score mesure la propension, pas l'effet causal ; aucune stratégie n'est rentable au centre** | « Nous savons bien classer qui rachètera (lift 5,26), pas qui rachètera grâce à l'e-mail. Avec nos hypothèses, aucune stratégie n'est rentable au scénario central ; il faut un gain de rachat d'environ +1,1 à +1,5 point sur Good. C'est pourquoi nous recommandons un test A/B avant tout déploiement. » |
| 3 | **AUC légèrement optimiste : réglage sur les mêmes plis, plis aléatoires** | « Le réglage s'est fait sur 40 000 clients tirés dans tous les plis, et les plis sont aléatoires, pas chronologiques. L'AUC de 0,8785 est donc une estimation légèrement optimiste ; le réglage entier n'apporte que +0,0021, ce qui borne l'écart. » |
| 4 | **Cible étroite : environ 1,9 jour d'activité** | « 7,7 % de rachat équivaut à environ 1,9 jour d'activité, alors que 62 à 80 % des clients rachètent chaque mois. Nous utilisons donc les scores pour classer, jamais comme des probabilités mensuelles, et nous demandons à vérifier la fenêtre de la cible. » |
| 5 | **Good : pari incrémental, test A/B peu puissant** | « Good rachète à 6,5 %, sous la moyenne : nous l'avons choisi car il n'est pas déjà acquis, pas parce qu'il rachète le plus. Notre test détecte au mieux 1,22 point (environ 18 % en relatif) ; en dessous, il faudrait plusieurs vagues. » |

Faiblesses mineures à connaître si on les creuse : clustering à silhouette 0,17 ; 45 % des clients sans e-mail ; profil d'identité potentiellement proxy d'âge/territoire ; le segment New pouvant contenir d'anciens clients qui reviennent (historique de 12 mois).

---

## 3. Mini-glossaire

- **AUC** : probabilité qu'un racheteur tiré au hasard ait un meilleur score qu'un non-racheteur (0,5 = hasard, 1 = parfait) ; ici 0,8785.
- **Précision @10 %** : part de vrais racheteurs parmi les 10 % de clients les mieux classés (40,6 %).
- **Rappel @10 % (recall@10 %)** : part de tous les racheteurs qui se trouvent dans ces 10 % (52,6 %).
- **Lift** : précision divisée par le taux moyen de rachat (40,6 % / 7,7 % = 5,26).
- **OOF (out-of-fold)** : score d'un client prédit par un modèle qui ne l'a pas vu à l'entraînement ; c'est ce qui est évalué.
- **Validation croisée à 5 plis** : on entraîne sur 4/5 des clients, on évalue sur le 1/5 restant, 5 fois ; mêmes plis pour tous les modèles.
- **Fuite temporelle** : utiliser, pour prédire, une information postérieure à la date de référence (ici le 1er août 2020).
- **Calibration** : les scores sont-ils des vraies probabilités ? Ici score moyen = 1,00 fois le taux réel.
- **Log-loss** : mesure l'écart entre probabilités prédites et issues réelles ; plus c'est bas, mieux c'est (0,1897).
- **Odds ratio (rapport de cotes)** : de combien la cote de rachat est multipliée quand la variable augmente d'un écart-type (régression logistique).
- **Lasso** : régression logistique pénalisée qui met à zéro les coefficients inutiles (44 non nuls sur 165).
- **LightGBM** : boosting d'arbres ; chaque arbre corrige les erreurs des précédents.
- **SHAP** : contribution de chaque variable à chaque score individuel ; la somme reconstitue le score.
- **Ablation** : retirer un groupe de variables et mesurer la perte d'AUC.
- **RFM** : segmentation par Récence, Fréquence, Montant ; ici 27 combinaisons regroupées en 7 segments (Top, Good, Decel, Small, Weak, New, Inactive).
- **Silhouette** : mesure de séparation des groupes d'un clustering (0,17 ici : faible).
- **ARI** : indice de concordance entre deux découpages (1 = identiques).
- **Propension** : probabilité de racheter, quoi qu'on fasse.
- **Uplift / effet incrémental** : rachats supplémentaires provoqués par la campagne, mesurés contre un groupe témoin.
- **Test A/B** : tirage aléatoire entre contactés et témoins pour mesurer l'effet causal.
- **MDE (effet minimal détectable)** : plus petit effet qu'un test peut détecter avec un risque de 5 % et une puissance de 80 % ; ici 1,22 point.
- **Seuil de rentabilité** : gain de rachat à partir duquel la marge nette est positive (hypothèses de marge et de remise).
- **KS (Kolmogorov-Smirnov)** : écart maximal entre deux distributions ; ici train vs test (≤ 0,005 en variables brutes).
- **Décile** : dixième de la base classée par score ; le 1er décile rachète à 40,6 %, le dernier à 0,3 %.

---

## 4. Dix chiffres à connaître par cœur

| # | Chiffre | Source |
|---|---|---|
| 1 | **160 424 clients** en train, **7,72 % de racheteurs** (12 392) ; 40 106 clients en test | 01_key_numbers.json |
| 2 | **Récence** : rachat 22,5 % si dernier achat ≤ 7 jours, **0,5 %** au-delà de 180 jours | 01_taux_rachat_par_classe.csv |
| 3 | **AUC** : récence seule **0,818** → Lasso **0,871** → LightGBM **0,8785** (écart-type 0,0022) | 06_model_selection.csv |
| 4 | **Top 10 %** (16 042 clients) : précision **40,6 %**, rappel **52,6 %**, lift **5,26** ; récence seule 23,5 % / 30,4 % | 06_key_numbers.json |
| 5 | **Calibration** : score moyen = 1,00 fois le taux réel, pente 1,01 ; décile 1 à 40,6 %, décile 10 à 0,3 % | 06_key_numbers.json |
| 6 | **SHAP** : 5 variables = **44 %** de l'importance ; n°1 : part d'achats le week-end | 06_key_numbers.json |
| 7 | **Calendrier** : août 2020 = **32,3 %** de jours de week-end (29,0 % en août 2019) ; sans variables week-end, AUC **0,8728** (−0,0058) | 06_diagnostic_calendrier.json |
| 8 | **Good** : **30 307** clients (**17 486** e-mailables), rachat **6,5 %**, 13 % des rachats, 17 % du CA | 07_key_numbers.json |
| 9 | **Test A/B** : 30 % de témoins, effet minimal détectable **1,22 point** ; **25 777** clients pour détecter 1 point | 07_key_numbers.json |
| 10 | **Seuil de rentabilité** (remise 10 %, hypothèses) : **+1,49 point** d'uplift sur la moitié haute de Good ; au scénario central aucune stratégie n'est rentable | 07_key_numbers.json |

Bonus : Top = 28 % des clients, 68 % du CA, 76 % des rachats (05_summary.md) ; 45,3 % des clients sans e-mail (01_summary.md) ; +5 282 racheteurs captés par rapport au hasard (07_key_numbers.json).

---

## 5. Petites incohérences entre fichiers (ne pas les citer à l'oral ; en cas de doute, utiliser la valeur indiquée)

| Point | Écart | Valeur à dire |
|---|---|---|
| Règle de récence | BRIEF_COMMUN.md : 23,6 % / 30,6 % ; résultats : 23,5 % / 30,4 % | 23,5 % / 30,4 % |
| AUC récence | 0,814 (01, par classes) contre 0,818 (02 et suivants, variable continue) | 0,818 |
| Jumeaux log | 02_summary : 31 ; 03_summary et 04 : 19 enregistrés (31, puis « 100 colonnes » : 98 − 17 + 31 ≠ 100) | ne pas citer ce nombre |
| Perte d'AUC sans week-end | 04 : −0,0054 (2 variables) ; 06 : −0,0058 | −0,0058 (06) |
| Rachat Good par tranche de score | 07_summary / key_numbers : 13,4 % / 3,6 % ; 07_good_tranches_score.csv : 13,8 % / 3,9 % (e-mailables) | « de 13 % à 4 % » |
| MDE de Good | 05 : 1,19 point (rachat 6,5 %) ; 07 : 1,22 point (e-mailables, rachat 7,0 %) | 1,22 (07) |
| Poids de la récence + fréquence | 68 % (02, modèle de contrôle) contre 69 % (04, modèle réglé) | « environ 70 % » |
| Variable n°1 | gain LightGBM : n_tickets_60 ; permutation et SHAP : share_weekend | préciser la méthode |
