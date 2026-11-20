# Script d'oral — Projet 2 (15 min)

Généré à partir des notes des slides. Les repères [m:ss] sont les temps cumulés visés.

## Slide 1

[0:00] Bonjour. Nous allons répondre à une question simple : parmi les clients d’un supermarché, qui va racheter le mois prochain ? Nous disposons de douze mois de tickets, du 1er août 2019 au 31 juillet 2020, pour 160 424 clients, et nous devons prédire qui rachètera en août 2020. Nous vous présentons d’abord les données et la récence, puis le modèle, puis un plan d’action sur un segment. [→ 0:15]

## Slide 2

[0:15] Le contexte est celui d’une enseigne de supermarché. Le marketing prépare un e-mail promotionnel et ne peut cibler que 10 % de la base, soit 16 042 clients sur 160 424. En août 2020, seuls 7,7 % des clients rachètent : 12 392 personnes. Tirer les clients au hasard ne capterait donc que 10 % des racheteurs. Par rapport au Projet 1, Feminiz, où nous avions décrit la clientèle avec la RFM et le segment Decel, nous passons ici de la description à la prédiction : un score de propension, jugé par l’AUC. La récence, déjà centrale en RFM, sera notre fil rouge. Voyons d’abord les données. [→ 0:55]

## Slide 3

[0:55] Voici le dispositif. Nous observons chaque client du 1er août 2019 au 31 juillet 2020, soit 3,29 millions de tickets, et nous prédisons s’il achète en août 2020. Le train compte 160 424 clients, dont 7,72 % de racheteurs, soit 12 392 ; le test compte 40 106 clients dont la cible est masquée, et il ressemble au train. Aucun ticket d’août n’est dans les fichiers, donc pas de fuite directe. Comme la cible est rare, seul le classement des clients compte, pas la valeur exacte des probabilités. Côté nettoyage, trois décisions : fusionner les 5 742 lignes de paiements fractionnés en tickets, traiter les retours à part pour qu’ils ne rajeunissent pas la récence, et plafonner les extrêmes sans supprimer de clients. [→ 1:45]

## Slide 4

[1:45] Premier résultat, et c’est le fil rouge de l’exposé : plus le dernier achat est récent, plus le client rachète. Un client venu dans les 7 derniers jours rachète à 22,5 % ; au-delà de 180 jours, 0,5 %, soit un rapport de 48. Un quart des clients, 25 %, n’est pas venu depuis plus de six mois. Cette règle sans modèle donne déjà une AUC de 0,818 ; en ciblant les 10 % les plus récents, la précision est de 23,5 % et le rappel de 30,4 %, pour un lift de 3. C’est donc notre référence : le modèle devra faire mieux. Voyons les variables que nous construisons pour cela. [→ 2:35]

## Slide 5

[2:35] Nous avons construit 100 variables, regroupées en six familles : récence et fréquence, 19 variables ; montant, 15 ; rythme et tendance, 20 ; saisonnalité et calendrier, 10 ; promotions et retours, 10 ; et profil et contexte, 26. Un modèle de contrôle non réglé s’appuie pour 68 % de son gain sur la récence et la fréquence : le reste affine. Le garde-fou principal est l’absence de fuite temporelle : toutes les variables sont calculées uniquement avec les tickets d’avant le 1er août 2020, la cible ne sert jamais à les fabriquer, et plafonds et regroupements sont appris sur le train puis appliqués au test. Un point de vigilance, que nous reprendrons : la famille calendrier contient la part d’achats le week-end, et août 2020 commence un samedi. Passons à la modélisation, du plus simple au plus riche. [→ 3:30]

## Slide 6

[3:30] Pour prédire le rachat d’août, nous avons procédé du plus simple au plus riche, avec exactement les mêmes 5 plis de validation croisée pour tous les modèles, donc des AUC comparables et calculées hors échantillon. Première marche : des règles sans modèle. La récence seule donne une AUC de 0,818 ; le score RFM du cours, 0,841. Deuxième marche : la logistique pénalisée, Lasso, qui monte à 0,871, soit +0,053 : c’est le plus gros saut de toute l’échelle. Troisième marche : arbre, k plus proches voisins et Naive Bayes, entre 0,859 et 0,864, donc moins bons que la logistique. Quatrième marche : forêt aléatoire, XGBoost et LightGBM réglés, de 0,875 à 0,8785. Le message : après la logistique, la complexité rapporte peu, +0,007 d’AUC. Les barres d’erreur, un écart-type entre plis d’environ 0,002, montrent que les modèles de la dernière marche sont proches entre eux. Nous retenons quand même LightGBM, parce qu’il gagne dans les 5 plis contre le Lasso, qui reste notre référence lisible. Voyons ce que donne le modèle final. 6

## Slide 7

[4:45] Voici le résultat du modèle final, LightGBM réglé : une AUC de 0,8785 en validation croisée, avec un écart-type entre plis de 0,0022. Mais l’enjeu métier est la contrainte des 10 % : le marketing ne peut contacter que 16 042 clients. Dans ce top 10 %, la précision est de 40,6 % : quatre clients ciblés sur dix rachètent, contre 7,7 % dans la base, soit un lift de 5,26. Le rappel est de 52,6 % : en contactant 10 % de la base, nous touchons plus de la moitié des racheteurs ; la règle de récence seule n’en capte que 30,4 %, le Lasso 50,9 %. À droite, les déciles : le premier rachète à 40,6 %, le dernier à 0,3 %, et les cinq derniers déciles ne contiennent que 5 % des racheteurs. Une précision : ce score est une probabilité de rachat. Cibler les plus probables n’est pas cibler les plus influençables : l’effet incrémental de l’action se mesurera par un test A/B, nous y reviendrons. Reste à comprendre ce qui explique ces scores. 7

## Slide 8

[6:15] Que dit le modèle ? À gauche, l’importance SHAP : cinq variables portent 44 % de l’importance. Ce sont la part des achats le week-end, le nombre de jours depuis l’avant-dernier achat, les tickets sur 60 jours, les jours depuis le dernier achat, et les tickets sur 180 jours. Les flèches donnent le sens : plus le client est récent et fréquent, plus son rachat est probable. Ce sens est le même que dans la logistique du notebook 3 pour 14 variables comparables sur 15, ce qui rassure sur la cohérence entre les deux modèles. À droite, le profil concret : le racheteur d’août a acheté il y a 15 jours en moyenne, contre 107 pour les autres ; il a 11,4 tickets sur 60 jours contre 2,4 ; et fait 32 % de ses achats le week-end contre 25 %. Un point nous préoccupe : la part de week-end arrive en tête du SHAP. Est-ce un vrai comportement ou un effet de calendrier ? C’est le sujet de la slide suivante, sur la robustesse. 8

## Slide 9

[7:30] Trois contrôles sur ce résultat, dont une limite que nous assumons. Un : la stabilité. L’AUC varie de 0,8757 à 0,8818 selon le pli, avec un écart-type de 0,0022, et LightGBM bat le Lasso dans les cinq plis. Elle reste un peu optimiste, car le réglage utilise les mêmes plis que l’évaluation. Deux : la calibration. Le score moyen est égal à 1,00 fois le taux réel, avec une pente de 1,01 : les scores sont de vraies probabilités, même si nous n’utilisons que le classement. Trois, la limite : la part d’achats le week-end. Sans elle et sans la part de samedi, l’AUC passe de 0,8785 à 0,8728, soit 0,0058 de perte : le modèle tient. Mais août 2020 commence un samedi et compte 10 jours de week-end sur 31, 32,3 %, contre 29,0 % en août 2019. Avec un seul mois cible, nous ne pouvons pas dire si cette variable capte un comportement durable ou un effet de calendrier. Pour un usage mensuel, il faudrait un test multi-coupures. Cela ne remet pas en cause le ciblage d’août, mais nous ne l’extrapolons pas. Voilà pour la modélisation, en 8 minutes 30 ; place à la segmentation et à la recommandation marketing. 9

## Slide 10

[8:30] Pour passer du score à une action, il faut un segment. Nous avons d'abord segmenté en RFM, avec des seuils métier : récence en trois classes à 14 et 60 jours, fréquence, montant, plus deux règles prioritaires, Inactive au-delà de 180 jours sans achat et New pour un premier ticket de moins de 90 jours. Cela donne sept segments. Top regroupe 28 % des clients, 68 % du chiffre d'affaires et rachète à 21,2 % ; Good pèse 15 % des clients, 17 % du chiffre d'affaires, avec un rachat de 6,5 %, contre 7,72 % pour l'ensemble de la base. À côté, nous avons fait un K-Means à six classes sur neuf variables de comportement, après ACP. La silhouette est de 0,17, sans coude net : il découpe un continuum plutôt qu'il ne révèle des groupes naturels. Et il n'apporte presque rien : l'AUC du RFM croisé avec les classes est de 0,829, contre 0,818 pour la récence seule et 0,807 pour le RFM seul. Nous gardons donc le RFM, plus lisible, et nous utilisons le clustering comme contrôle. Voyons maintenant lequel de ces segments choisir. 10

## Slide 11

[9:45] Nous avons évalué treize candidats, sept segments RFM et six classes, avec des critères fixés avant de regarder le classement. Deux sont éliminatoires : la taille, qui doit permettre un test A/B, et le fait de ne pas être déjà acquis. Top et les Réguliers sont écartés : ils rachètent à 21 %, ils reviendraient de toute façon. C3 Montants est le second choix, avec quatre critères sur sept. Good coche les sept : 30 307 clients sur la base complète, dont 17 486 joignables par e-mail, ce qui tient dans l'enveloppe de 20 053 clients, soit 10 % de la base. Ce sont des clients déjà actifs, 8,1 mois sur 12, mais qui rachètent à 6,5 %, donc pas saturés. Nous devons être honnêtes : Top occupe 96 % du top 10 % par score ; Good n'y a que 238 clients. Good n'est pas le segment où le score capte le plus de rachats, c'est un pari incrémental. Dans Good, le score trie quand même : 13,4 % de rachat dans les 20 % du haut, 3,6 % dans la moitié basse. Mais propension n'est pas effet causal : le score ne dit pas qui réagit à une campagne, d'où un test sur tout le segment. 11

## Slide 12

[11:00] Voici le plan d'action sur Good. Le client type est régulier : 17 tickets sur 12 mois, actif 8,1 mois sur 12, un achat tous les 18 jours environ, un panier médian de 43 euros, et 58 % sont joignables par e-mail. Trois leviers ressortent en comparant ceux qui rachètent en août à ceux qui ne rachètent pas : la régularité, avec 9,0 mois actifs contre 8,1 ; un rythme d'achat plus court, 13,6 jours entre deux achats contre 17,9 ; et le week-end, 32 % des tickets contre 26 %. Attention, c'est un effet de calendrier possible : août 2020 commence un samedi. D'où le message, « votre prochain panier du week-end », en e-mail, le canal que nous pouvons mesurer et dont le coût est faible, envoyé le jeudi ou le vendredi matin, puisque Good achète surtout le vendredi et le samedi. L'envoi se déclenche au rythme du client, avec une relance avant 60 jours sans achat, avant le basculement vers Decel. Nous prévoyons une variante avec remise de 10 % et une variante sans remise. Reste à savoir combien cela peut rapporter. 12

## Slide 13

[12:30] Combien cela peut rapporter ? Attention : tous les euros de cette slide reposent sur des hypothèses, ce ne sont pas des prévisions. Nous supposons 0,02 euro par contact, 25 % de marge, une remise de 10 % utilisée par 30 % des clients, et un effet de la campagne de +0,5, +1 ou +2 points de rachat. Résultat : avec une remise de 10 %, au scénario central, à +1 point, aucune stratégie n'est rentable. Tout Good perd 0,2 millier d'euros, le top 10 % par score perd 8,5 milliers : cibler les plus probables revient à offrir la remise à des gens qui auraient acheté de toute façon. Ce n'est pas la même chose de cibler les plus probables et les plus influençables. Tout Good devient rentable à +2 points, avec 1,9 millier d'euros. Le seuil de rentabilité de tout Good est de 1,11 point avec la remise de 10 %, 0,60 avec 5 %, et seulement 0,14 point pour un rappel sans remise. Pour le mesurer, un test A/B sur les 17 486 e-mailables de Good, 70 % traités, 30 % témoins : l'effet minimal détectable est de 1,22 point, juste au-dessus du seuil de 1,11. Quatre semaines de test, puis un suivi à 60 jours. 13

## Slide 14

[14:00] Pour conclure, trois messages. Un : la récence fait l'essentiel, la performance du modèle est de 0,879 en AUC en validation croisée contre 0,818 pour la récence seule, et avec 10 % de la base, le top 10 % capte 53 % des racheteurs, avec 40,6 % de précision. Deux : notre recommandation porte sur le segment Good, 17 486 clients joignables par e-mail, qui rachètent à 6,5 % : un pari incrémental, qui tient dans l'enveloppe de 10 %. Trois : la rentabilité ne se déduit pas d'un score, elle se prouve. La remise de 10 % n'est pas rentable au scénario central, le seuil est de 1,11 point, un rappel sans remise est rentable dès 0,14 point, et le test A/B détecte 1,22 point. Nos limites : un seul mois cible, un effet de calendrier possible, et une propension qui n'est pas un effet causal. Prochaines étapes : lancer le test, multiplier les coupures, puis passer à un modèle d'uplift. Notre score sur le leaderboard Kaggle est de [score Kaggle à insérer]. Merci, nous sommes prêts pour vos questions. 14

## Slide 15

Annexes, hors temps de présentation : elles servent de réserve pour les questions du jury (variables, modèles, validation, nettoyage, segmentation, hypothèses). 15

## Slide 16

Dix familles, 81 variables de base, toutes calculées avec les seuls tickets antérieurs au 1er août 2020 : aucune fuite de la cible. Les jumeaux log ne servent qu'aux modèles linéaires. 16

## Slide 17

Treize modèles, tous évalués sur les mêmes cinq plis. Le LightGBM réglé a la meilleure AUC, mais la différence avec XGBoost réglé est dans le bruit : nous le retenons pour sa vitesse et ses valeurs SHAP exactes. 17

## Slide 18

Les cinq plis sont fixés une fois pour toutes et stratifiés sur la cible. Le réglage utilise les mêmes plis que l'évaluation, donc l'AUC est un peu optimiste ; nous le disons plutôt que de le cacher. 18

## Slide 19

Vingt décisions de nettoyage au total ; ici les huit qui comptent pour la lecture des résultats. Principe constant : on documente et on garde l'information plutôt que d'imputer ou de supprimer. 19

## Slide 20

Retirer la saisonnalité coûte 64 points d'AUC sur 10 000, les neuf autres familles presque rien : elles se recouvrent. Le poids de la part de week-end est notre point de vigilance, car août 2020 commence un samedi. 20

## Slide 21

Les seuils métier sont lisibles et stables ; les tertiles du train donnent les mêmes étiquettes pour 81 % des clients. Good est le segment retenu pour le plan d'action : 24 203 clients, rachat 6,5 %. 21

## Slide 22

Tout ce qui est en euros est une hypothèse, étiquetée comme telle. Avec 17 486 clients e-mailables et 30 % de témoins, nous ne détectons qu'un effet d'au moins 1,22 point : sous ce seuil, il faut plusieurs vagues. 22

## Slide 23

La logistique pénalisée est notre référence interprétable : AUC 0,8714. Ses odds ratios vont dans le même sens que les valeurs SHAP du LightGBM pour 14 variables sur 15. 23
