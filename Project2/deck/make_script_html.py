"""Génère deck/Script_oral_Projet2_dark.html : script à gauche, diapo à droite, fond noir (format du Projet 1).

Usage : python make_script_html.py <dossier_jpg_des_slides> [sortie.html]
Les slides sont les JPEG rendus depuis le .pptx (s-01.jpg ... s-23.jpg).
"""
import base64, html, io, re, sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
JPG = Path(sys.argv[1])
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / 'Script_oral_Projet2_dark.html'
WPM = 150  # débit de référence pour contrôler que les temps de parole sont tenables

# ----------------------------------------------------------------------------- contenu
# (n°, titre, secondes allouées, [paragraphes], [notes de mise en scène], html "Pour comprendre" ou None)
S = {}

S[1] = ('Titre', 15, [
    "Bonjour à toutes et à tous. Nous sommes Antoine, Mathis et Nils. Parmi les clients d’un supermarché, qui va racheter le mois prochain ? C’est la question à laquelle nous avons répondu, et voici ce que nous recommandons d’en faire.",
], ['Regarder le jury. Une seule phrase, on enchaîne vite.'], None)

S[2] = ('Contexte et enjeu', 50, [
    "Le contexte : une enseigne de supermarché qui prépare un e-mail promotionnel. Le marketing ne peut cibler que 10 % de la base, soit 16 042 clients sur 160 424. Or en août 2020, seuls 7,7 % des clients rachètent, 12 392 personnes. Tirés au hasard, nos 10 % ne captent donc que 10 % des racheteurs. L’enjeu est de bien classer les clients, pas de deviner une probabilité exacte. Concrètement, il y a deux questions : qui contacter, et que leur dire. Nous répondons à la première avec un modèle, et à la seconde avec un segment.",
    "Par rapport au Projet 1, Feminiz, nous passons de la description à la prédiction : un score de propension par client, jugé par l’AUC. Et la récence, déjà au cœur de la RFM, sera notre fil rouge.",
], [], None)

S[3] = ('Données et cible', 55, [
    "Voici le dispositif. Pour chaque client, nous observons douze mois de tickets, du 1er août 2019 au 31 juillet 2020, soit 3,29 millions de tickets, et nous prédisons s’il achète en août 2020. L’apprentissage porte sur 160 424 clients, dont 7,72 % de racheteurs ; le test compte 40 106 clients dont la cible est masquée, et il ressemble à l’apprentissage, ce qui nous permet d’appliquer le modèle tel quel. Aucun ticket d’août n’est dans les fichiers : pas de fuite directe. Comme la cible est rare, seul compte le classement des clients, pas la valeur exacte des probabilités.",
    "Trois choix de nettoyage comptent. Nous fusionnons les 5 742 lignes de paiements fractionnés en tickets. Nous traitons les retours à part, pour qu’ils ne rajeunissent pas la récence. Et nous plafonnons les valeurs extrêmes, sans supprimer aucun client.",
], ['Pointer la frise : vert = ce qu’on observe, orange = ce qu’on prédit.'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>Pourquoi « seul le classement compte » ?</b> Avec 7,7 % de racheteurs, la probabilité exacte de chaque client importe peu : le marketing ne peut contacter que 10 % de la base, donc il lui faut une <i>liste ordonnée</i>. Un bon modèle met les futurs racheteurs en haut de la liste. C’est exactement ce que mesure l’AUC.</p>
<p><b>Fuite temporelle.</b> Tout ce qui sert à prédire doit être connu <i>avant</i> le 1er août 2020. Si une variable contenait de l’information d’août, le modèle triche et ne marcherait plus en vrai.</p>
<p class="say">À dire si on demande : « Un ticket est un couple (client, instant) : les paiements fractionnés créent plusieurs lignes, nous en avons regroupé 5 742 sans perdre d’information. »</p></details>''')

S[4] = ('La récence', 55, [
    "Premier résultat, et c’est le fil rouge de notre exposé : plus le dernier achat est récent, plus le client rachète. Un client venu dans les 7 derniers jours rachète à 22,5 % ; au-delà de 180 jours, à 0,5 %, soit 48 fois moins. Un quart de la base n’est pas venu depuis plus de six mois. En clair : un client qui vient d’acheter a de fortes chances de revenir bientôt, et un client qui a disparu a très peu de chances de revenir.",
    "Cette règle, sans aucun modèle, donne déjà une AUC de 0,818. L’AUC mesure la capacité à classer un racheteur au-dessus d’un non-racheteur : 0,5, c’est le hasard, 1, c’est parfait. Si l’on cible les 10 % les plus récents, 23,5 % rachètent, et l’on capte 30,4 % des racheteurs. C’est notre référence : le modèle devra faire nettement mieux.",
], ['Pointer la barre orange (≤ 7 jours), puis la dernière barre (> 180 jours).'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>Taux de rachat selon l’ancienneté du dernier achat (au 01/08/2020) :</b></p>
<table><tr><th>Dernier achat</th><th>≤ 7 j</th><th>8-14 j</th><th>15-30 j</th><th>31-60 j</th><th>61-90 j</th><th>91-180 j</th><th>&gt; 180 j</th></tr>
<tr><td>Rachat en août</td><td><b>22,5 %</b></td><td>10,9 %</td><td>6,6 %</td><td>3,4 %</td><td>2,0 %</td><td>0,9 %</td><td><b>0,5 %</b></td></tr>
<tr><td>Part des clients</td><td>24 %</td><td>9 %</td><td>11 %</td><td>12 %</td><td>6 %</td><td>13 %</td><td>25 %</td></tr></table>
<p><b>AUC, intuition.</b> On tire au hasard un racheteur et un non-racheteur : l’AUC est la probabilité que le racheteur ait le meilleur score. 0,818 pour la récence seule : c’est déjà bien, donc la barre est haute.</p>
<p class="say">À dire : « Ce n’est pas un modèle compliqué qui fait l’essentiel, c’est la récence ; le modèle sert à affiner. »</p></details>''')

S[5] = ('Les variables construites', 50, [
    "Pour battre cette référence, nous avons construit une centaine de variables, en six familles : récence et fréquence, montant, rythme et tendance, saisonnalité et calendrier, promotions et retours, et profil du client. Un modèle de contrôle non réglé tire 68 % de son gain de la récence et de la fréquence : le reste affine. Par exemple : le nombre de tickets sur 7, 30, 60 ou 180 jours, l’écart habituel entre deux achats, ou la part des achats faits le soir ou le week-end. Au total, 81 variables de base, plus leurs versions en logarithme pour les modèles linéaires.",
    "Le garde-fou principal : aucune fuite temporelle. Toutes les variables sont calculées avec les seuls tickets d’avant le 1er août 2020, et les plafonds sont appris sur l’apprentissage puis appliqués au test. Un point de vigilance, que nous reprendrons : la famille calendrier contient la part d’achats le week-end.",
], [], None)

S[6] = ('Démarche de modélisation', 75, [
    "Pour modéliser, nous avons procédé du plus simple au plus riche, avec exactement les mêmes cinq plis de validation croisée pour tous les modèles : les AUC sont donc comparables, et toutes calculées hors échantillon. Pour les modèles réglés, nous avons cherché les meilleurs réglages sur un échantillon de 40 000 clients, puis nous les avons évalués sur toute la base.",
    "Première marche, des règles sans modèle : la récence seule donne 0,818, le score RFM du cours 0,841. Deuxième marche, la logistique pénalisée Lasso : 0,871, soit 0,053 de plus. C’est le plus gros saut de l’échelle. Troisième marche, arbre, k plus proches voisins et Naive Bayes : entre 0,859 et 0,864, donc moins bons que la logistique. Quatrième marche, forêt aléatoire, XGBoost et LightGBM réglés : de 0,875 à 0,8785.",
    "Le message : après la logistique, la complexité rapporte peu, 0,007 d’AUC. Nous retenons tout de même LightGBM, qui bat le Lasso dans les cinq plis, et nous gardons le Lasso comme référence lisible. Nils vous présente le résultat.",
], ['Pointer l’échelle de haut en bas. Fin de ta partie : passer la parole à Nils.'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>Validation croisée à 5 plis.</b> On coupe les clients en 5 paquets. On entraîne le modèle sur 4 paquets et on le teste sur le 5e, puis on recommence 5 fois. Chaque client est donc noté par un modèle qui ne l’a jamais vu : c’est l’AUC « hors échantillon ». Les mêmes paquets (graine 42) servent pour tous les modèles, donc la comparaison est équitable.</p>
<p><b>Lasso.</b> Une régression logistique qui met à zéro les variables inutiles : lisible (on lit les coefficients), solide.</p>
<p><b>LightGBM.</b> Des centaines de petits arbres, chacun corrigeant les erreurs des précédents. Plus souple, mais moins lisible : d’où SHAP pour l’interpréter.</p>
<p class="say">À dire si on demande pourquoi garder LightGBM pour un gain de 0,007 : « Il gagne dans les 5 plis contre le Lasso, et il est rapide ; mais le Lasso reste notre référence lisible. »</p></details>''')

S[7] = ('Le modèle final', 90, [
    "Merci Mathis. Voici le modèle final, un LightGBM réglé. Son AUC est de 0,8785 en validation croisée, avec un écart-type entre plis de 0,0022.",
    "Mais le vrai critère est la contrainte des 10 % : le marketing ne peut contacter que 16 042 clients. Dans ce top 10 %, la précision est de 40,6 % : quatre clients ciblés sur dix rachètent, contre 7,7 % dans la base. C’est un lift de 5,26. Le rappel est de 52,6 % : en contactant 10 % de la base, nous touchons plus de la moitié des racheteurs. Pour fixer les idées : sur les 16 042 clients ciblés, 6 521 rachètent, alors qu’au hasard nous n’en aurions eu qu’environ 1 240. La règle de récence seule n’en capte que 30,4 %, le Lasso 50,9 %.",
    "À droite, les déciles : le premier décile rachète à 40,6 %, le dernier à 0,3 %. Les scores trient très bien.",
    "Une précision importante : ce score est une probabilité de rachat. Cibler les plus probables n’est pas cibler les plus influençables ; l’effet réel d’une campagne se mesure avec un test A/B, nous y reviendrons. Voyons maintenant ce qui explique ces scores.",
], ['Pointer le point orange sur la courbe de gain (10 % ciblés → 52,6 % des racheteurs).'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>Précision, rappel, lift : un seul exemple.</b> On contacte les 10 % de clients les mieux classés.</p>
<table><tr><th></th><th>Clients ciblés</th><th>Racheteurs captés</th><th>Lecture</th></tr>
<tr><td>Au hasard</td><td>16 042</td><td>≈ 1 239 (7,7 %)</td><td>précision 7,7 %, rappel 10 %</td></tr>
<tr><td>Notre modèle</td><td>16 042</td><td>6 521</td><td>précision 6 521 / 16 042 = <b>40,6 %</b> ; rappel 6 521 / 12 392 = <b>52,6 %</b></td></tr></table>
<p><b>Lift</b> = précision / taux moyen = 40,6 % / 7,7 % = <b>5,26</b> : on touche 5 fois plus de racheteurs qu’au hasard.</p>
<p><b>Propension ≠ effet causal.</b> Le score dit « ce client rachètera probablement », pas « ce client rachètera grâce à l’e-mail ». Beaucoup de clients très probables achèteraient de toute façon.</p></details>''')

S[8] = ('Ce qui explique le rachat', 80, [
    "Que dit le modèle ? À gauche, l’importance SHAP, qui mesure la contribution de chaque variable aux scores. Cinq variables portent 44 % de l’importance : la part d’achats le week-end, le nombre de jours depuis l’avant-dernier achat, les tickets sur 60 jours, les jours depuis le dernier achat, et les tickets sur 180 jours. Les flèches donnent le sens : plus un client est récent et fréquent, plus son rachat est probable. Ce sens est le même que dans la logistique pour 14 variables comparables sur 15, ce qui rassure. Par exemple, un client venu la semaine dernière, qui achète plusieurs fois par mois, aura un score élevé ; un client qui n’est pas venu depuis trois mois, un score très bas.",
    "À droite, le profil concret du racheteur d’août : dernier achat il y a 15 jours en moyenne, contre 107 pour les autres ; 11,4 tickets sur les 60 derniers jours, contre 2,4 ; et 32 % de ses achats faits le week-end, contre 25 %.",
    "Un point nous préoccupe : la part de week-end arrive en tête. Est-ce un vrai comportement, ou un effet de calendrier ? C’est le sujet de la slide suivante.",
], ['Pointer la barre orange (week-end), puis le profil à droite.'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>SHAP, en une phrase.</b> Pour chaque client, SHAP répartit son score entre les variables : « +x parce que le dernier achat est récent, −y parce qu’il n’y a eu qu’un ticket… ». La moyenne de ces contributions donne l’importance globale. La somme reconstitue exactement le score.</p>
<p><b>Les flèches ↑ ↓.</b> ↑ : plus la valeur de la variable est haute, plus le rachat est probable (ex. tickets sur 60 jours). ↓ : l’inverse (ex. jours depuis le dernier achat).</p>
<p class="say">Si on demande pourquoi la part de week-end domine : « C’est notre point de vigilance : août 2020 commence un samedi. Nous le détaillons slide 9. »</p></details>''')

S[9] = ('Robustesse et limites', 70, [
    "Trois contrôles, dont une limite que nous assumons. Un, la stabilité : l’AUC varie de 0,8757 à 0,8818 selon le pli, et LightGBM bat le Lasso dans les cinq plis. Elle reste un peu optimiste, car le réglage utilise les mêmes plis que l’évaluation. Deux, la calibration : le score moyen vaut 1,00 fois le taux réel, donc les scores sont de vraies probabilités, même si nous n’utilisons que le classement.",
    "Trois, la limite. Sans la part de week-end et de samedi, l’AUC passe de 0,8785 à 0,8728 : le modèle tient. Mais août 2020 commence un samedi : 10 jours de week-end sur 31, contre 9 en août 2019. Avec un seul mois cible, nous ne pouvons pas dire si cette variable capte un comportement durable ou un effet de calendrier. Nous ne l’extrapolons donc pas à d’autres mois ; il faudrait un test sur plusieurs coupures. Cela ne change pas notre recommandation pour août, mais cela guide la suite, et nous le reprenons dans nos prochaines étapes.",
], ['Montrer le calendrier orange à droite. Ton franc : c’est une limite assumée, pas une faille cachée.'],
'''<details class="why"><summary>Pour comprendre</summary>
<table><tr><th></th><th>Août 2019</th><th>Août 2020</th></tr>
<tr><td>Jours de week-end</td><td>9 sur 31</td><td><b>10 sur 31</b></td></tr>
<tr><td>Part de jours de week-end</td><td>29,0 %</td><td><b>32,3 %</b></td></tr></table>
<p><b>Calibration.</b> On regroupe les clients par niveau de score et on compare le score moyen au taux réel de rachat : ils coïncident (pente 1,01). Utile pour les euros, pas pour le classement.</p>
<p><b>Pourquoi on ne peut pas trancher.</b> Un seul mois cible : si la variable week-end pèse autant, soit le comportement est durable, soit c’est propre à ce mois. Un test sur plusieurs coupures mensuelles le dirait ; c’est hors du périmètre du projet.</p>
<p class="say">À dire : « Cela ne remet pas en cause le ciblage d’août, mais nous ne l’extrapolons pas à un usage mensuel sans test. »</p></details>''')

S[10] = ('Segmentation', 60, [
    "Pour passer du score à une action, il faut un segment : un marketeur ne gère pas 160 000 scores, il gère des groupes, avec un message et un budget. Le score dit qui est probable ; le segment dit à qui parler et comment. Nous avons d’abord segmenté en RFM, avec des seuils métier : récence à 14 et 60 jours, fréquence, montant, et deux règles prioritaires, Inactive au-delà de 180 jours sans achat et New pour un premier ticket récent. Cela donne sept segments. Top regroupe 28 % des clients, 68 % du chiffre d’affaires et rachète à 21,2 % ; Good pèse 15 % des clients et rachète à 6,5 %, contre 7,72 % pour toute la base.",
    "Nous avons aussi fait un K-Means à six classes. Sa silhouette est de 0,17 : il découpe un continuum plutôt qu’il ne révèle des groupes naturels, et il apporte peu. Nous gardons donc le RFM, plus lisible. Antoine va vous dire quel segment nous recommandons.",
], ['Pointer la ligne orange (Good). Fin de ta partie : passer la parole à Antoine.'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>RFM</b> = Récence, Fréquence, Montant. Seuils métier : récence ≤ 14 j / ≤ 60 j / plus ; fréquence ≤ 5 / ≤ 24 / plus de tickets sur 12 mois ; montant ≤ 150 € / ≤ 1 000 € / plus. Les 27 combinaisons sont regroupées en 7 segments lisibles.</p>
<p><b>Silhouette.</b> Mesure de 0 à 1 de la séparation des classes d’un clustering. 0,17 : faible, les classes se touchent. Il n’existe pas de « vrais » groupes, seulement un continuum de comportements.</p>
<p><b>K-Means après ACP.</b> L’ACP résume 9 variables de comportement en 6 axes (83 % de la variance), puis K-Means forme 6 classes. La CAH de Ward est d’accord mais seulement en partie (indice ARI 0,34).</p></details>''')

S[11] = ('Le segment Good', 80, [
    "Merci Nils. Nous avons comparé les candidats avec des critères fixés avant de regarder le classement. Deux sont éliminatoires : une taille compatible avec un test A/B, et ne pas être un segment déjà acquis. Top est écarté : il rachète à 21 %, il reviendrait de toute façon. C3 Montants est notre second choix, avec quatre critères sur sept.",
    "Good les remplit tous les sept : 17 486 clients joignables par e-mail, ce qui tient dans l’enveloppe de 20 053 clients, soit 10 % de la base. Ce sont des clients actifs, 8,1 mois sur 12, mais qui rachètent à 6,5 % : ils ne sont pas saturés.",
    "Soyons honnêtes : Top occupe 96 % du top 10 % par score, et Good n’y a que 238 clients. Good n’est pas le segment où le score capte le plus de rachats : c’est un pari incrémental. Mais dans Good, le score trie bien : 13,4 % de rachat dans les 20 % du haut, 3,6 % dans la moitié basse. Et il ne dit pas qui réagit à une campagne : d’où un test sur tout le segment. C’est pourquoi nous ne choisissons pas le segment le plus probable, mais celui où l’on peut apprendre quelque chose.",
], ['Lire la colonne Good (orange/verte) de haut en bas. Ne pas cacher la nuance des 96 %.'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>Pourquoi pas Top, qui rachète le plus ?</b> Parce que ses clients rachètent déjà seuls (21,2 %) : une remise leur est offerte pour rien. Le seuil de rentabilité d’une remise de 10 % est de 3,1 points d’uplift sur Top, contre 1,1 sur Good.</p>
<p><b>« Pari incrémental ».</b> L’hypothèse est que, parmi des clients actifs mais pas acquis, un rappel déclenche des achats supplémentaires. Les données ne le prouvent pas : seul un test A/B le fera.</p>
<p><b>Enveloppe de 10 %.</b> 20 053 clients ciblables sur la base complète (200 530 clients) ; Good compte 17 486 joignables par e-mail, donc tient dans l’enveloppe.</p>
<p class="say">À dire si on conteste : « Nous ne prétendons pas que Good rachète le plus. Nous prétendons que c’est le meilleur endroit pour mesurer un effet. »</p></details>''')

S[12] = ('Plan d’action sur Good', 80, [
    "Voici le plan d’action sur Good. Le client type est régulier : 17 tickets sur douze mois, actif 8,1 mois sur 12, un achat tous les 18 jours environ, un panier médian de 43 euros, et 58 % sont joignables par e-mail.",
    "Trois leviers ressortent quand on compare ceux qui rachètent en août aux autres : la régularité, 9 mois actifs contre 8,1 ; un rythme d’achat plus court, 13,6 jours entre deux achats contre 17,9 ; et le week-end, 32 % des tickets contre 26 %. Ce sont des associations, pas des causes, et le week-end peut être un effet de calendrier.",
    "D’où le message : « votre prochain panier du week-end », par e-mail, canal peu coûteux et mesurable, envoyé le jeudi ou le vendredi matin. L’envoi suit le rythme du client, avec une relance avant 60 jours sans achat, avant le basculement vers le segment Decel. Nous testons deux variantes : avec remise de 10 %, et sans remise. Le suivi s’étale de 14 jours avant à 60 jours après l’envoi, pour mesurer le rachat à court terme et le basculement éventuel vers Decel.",
], ['Pointer les trois barres de droite, puis les trois cartes du bas (message, canal, calendrier).'], None)

S[13] = ('Rentabilité et test A/B', 80, [
    "Combien cela peut-il rapporter ? Attention : tous les euros de cette slide sont des hypothèses, pas des prévisions. Nous supposons 0,02 euro par contact, 25 % de marge, une remise de 10 % utilisée par 30 % des clients, et un effet de la campagne de 0,5, 1 ou 2 points de rachat.",
    "Résultat : avec une remise de 10 %, au scénario central, aucune stratégie n’est rentable. Tout Good perd 0,2 millier d’euros ; le top 10 % par score perd 8,5 milliers, parce qu’on offre la remise à des clients qui auraient acheté de toute façon. Le seuil de rentabilité de tout Good est de 1,11 point avec 10 % de remise, 0,60 avec 5 %, et seulement 0,14 point pour un rappel sans remise.",
    "Pour le mesurer : un test A/B sur les 17 486 clients joignables, 70 % traités et 30 % témoins. L’effet minimal détectable est de 1,22 point, juste au-dessus du seuil de 1,11. Quatre semaines de test, puis un suivi à 60 jours. En clair : mieux vaut commencer par une offre légère, un simple rappel, que par une grosse remise, et laisser le test nous dire ce qui marche.",
], ['Insister sur le mot « hypothèse » (étiquette orange). Ne jamais présenter ces euros comme une prévision.'],
'''<details class="why"><summary>Pour comprendre</summary>
<p><b>Marge nette (k€), remise de 10 % — hypothèses :</b></p>
<table><tr><th>Stratégie</th><th>+0,5 pt</th><th>+1 pt (central)</th><th>+2 pts</th></tr>
<tr><td>Tout Good (17 486)</td><td>−1,3</td><td><b>−0,2</b></td><td>+1,9</td></tr>
<tr><td>10 % au hasard</td><td>−2,1</td><td>−0,9</td><td>+1,5</td></tr>
<tr><td>Top 10 % par score</td><td>−9,7</td><td><b>−8,5</b></td><td>−6,1</td></tr></table>
<p><b>Pourquoi le top 10 % par score est pire.</b> Ses clients rachètent déjà (40 %) : la remise de 10 % est offerte à ceux qui auraient acheté de toute façon, ce qui coûte de la marge sans rien gagner.</p>
<p><b>Seuil de rentabilité.</b> L’uplift minimal (en points de rachat) pour que la marge supplémentaire couvre la remise et le coût de contact. <b>Effet minimal détectable (MDE).</b> Le plus petit effet que le test peut distinguer du hasard (risque 5 %, puissance 80 %) : ici 1,22 point. Comme 1,11 &lt; 1,22, un seul test ne tranche pas à coup sûr la rentabilité d’une remise de 10 %.</p>
<p class="say">À dire : « Nous ne promettons aucun gain : nous proposons un test, et nous disons à quel effet il devient rentable. »</p></details>''')

S[14] = ('Conclusion', 60, [
    "Pour conclure, trois messages. Un : la récence fait l’essentiel ; notre modèle atteint une AUC de 0,879 contre 0,818 pour la récence seule, et en ciblant 10 % de la base, nous captons 53 % des racheteurs avec 40,6 % de précision. Deux : nous recommandons le segment Good, 17 486 clients joignables par e-mail, un pari incrémental qui tient dans l’enveloppe des 10 %. Trois : la rentabilité ne se déduit pas d’un score, elle se prouve : la remise de 10 % n’est pas rentable au scénario central, un simple rappel l’est dès 0,14 point, et le test A/B détecte 1,22 point.",
    "Nos limites : un seul mois cible, un possible effet de calendrier, et une propension qui n’est pas un effet causal. La suite : lancer le test, multiplier les coupures temporelles, puis passer à un modèle d’uplift. Notre score sur le classement Kaggle est de [score Kaggle à insérer]. En une phrase : un modèle qui classe bien, un segment où tester, et un test qui dira si l’argent est bien dépensé. Merci, nous sommes prêts pour vos questions.",
], ['À compléter avant l’oral : le score Kaggle (encart orange en pointillés sur la slide). Rester sur cette slide pendant les questions.'], None)

ANNEX = {
    15: ('Annexes (intercalaire)', "Hors temps de présentation : elles servent de réserve pour les questions du jury (variables, modèles, validation, nettoyage, segmentation, hypothèses)."),
    16: ('A1 · Dictionnaire des variables', "Dix familles, 81 variables de base, toutes calculées avec les seuls tickets antérieurs au 1er août 2020 : aucune fuite de la cible. Les jumeaux log ne servent qu’aux modèles linéaires."),
    17: ('A2 · Comparaison des modèles', "Treize modèles, tous évalués sur les mêmes cinq plis. Le LightGBM réglé a la meilleure AUC, mais la différence avec XGBoost réglé est dans le bruit : nous le retenons pour sa vitesse et ses valeurs SHAP exactes."),
    18: ('A3 · Protocole de validation', "Les cinq plis sont fixés une fois pour toutes et stratifiés sur la cible. Le réglage utilise les mêmes plis que l’évaluation, donc l’AUC est un peu optimiste ; nous le disons plutôt que de le cacher."),
    19: ('A4 · Nettoyage des données', "Vingt décisions de nettoyage au total ; ici les huit qui comptent pour la lecture des résultats. Principe constant : on documente et on garde l’information plutôt que d’imputer ou de supprimer."),
    20: ('A5 · Ablation et importance', "Retirer la saisonnalité coûte 64 points d’AUC sur 10 000, les autres familles presque rien : elles se recouvrent. Le poids de la part de week-end est notre point de vigilance, car août 2020 commence un samedi."),
    21: ('A6 · Segments RFM et classes', "Les seuils métier sont lisibles et stables ; les tertiles du train donnent les mêmes étiquettes pour 81 % des clients. Good est le segment retenu pour le plan d’action : 24 203 clients, rachat 6,5 %."),
    22: ('A7 · Hypothèses et test A/B', "Tout ce qui est en euros est une hypothèse, étiquetée comme telle. Avec 17 486 clients joignables et 30 % de témoins, nous ne détectons qu’un effet d’au moins 1,22 point : sous ce seuil, il faut plusieurs vagues."),
    23: ('A8 · Régression logistique', "La logistique pénalisée est notre référence interprétable : AUC 0,8714. Ses odds ratios vont dans le même sens que les valeurs SHAP du LightGBM pour 14 variables sur 15."),
}

SPEAKERS = [
    ('Mathis', 'ouverture, données, variables et démarche de modélisation', [1, 2, 3, 4, 5, 6]),
    ('Nils', 'le modèle final, ses explications, sa robustesse et la segmentation', [7, 8, 9, 10]),
    ('Antoine', 'le segment recommandé, le plan d’action, la rentabilité et la conclusion', [11, 12, 13, 14]),
]

# ----------------------------------------------------------------------------- utilitaires
def esc(t): return html.escape(t, quote=False)
def nwords(t): return len(re.findall(r"[\w’'\-]+", t))
def mmss(sec):
    return f'{sec // 60} min {sec % 60:02d}' if sec % 60 else f'{sec // 60} min'
def img64(n):
    im = Image.open(JPG / f's-{n:02d}.jpg').convert('RGB')
    w = 1280
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=80, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

def inline(t):
    t = esc(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    return t

def qa_html():
    """Convertit les sections 1 à 4 de QA_oral.md en HTML (questions, faiblesses, glossaire, chiffres)."""
    md = (HERE / 'QA_oral.md').read_text(encoding='utf8').splitlines()
    out, i, sec = [], 0, None
    def table(lines):
        rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in lines if not re.match(r'^\|[-\s|]+\|$', l.strip())]
        h = '<table><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in rows[0]) + '</tr>'
        for r in rows[1:]: h += '<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>'
        return h + '</table>'
    while i < len(md):
        l = md[i]
        m = re.match(r'^## (\d)\. (.*)', l)
        if m:
            sec = int(m.group(1)); i += 1
            if sec in (1, 2, 3, 4): out.append(f'<h4 class="qh">{esc(m.group(2))}</h4>')
            continue
        if sec not in (1, 2, 3, 4): i += 1; continue
        if l.startswith('### '): out.append(f'<h4 class="grp">{esc(l[4:])}</h4>')
        elif l.startswith('**Q'): out.append(f'<h3>{inline(l.strip("*"))}</h3>')
        elif l.startswith('> '): out.append(f'<p>{inline(l[2:])}</p>')
        elif l.startswith('Sources :'): out.append(f'<p class="src">{inline(l)}</p>')
        elif l.startswith('|'):
            j = i
            while j < len(md) and md[j].startswith('|'): j += 1
            out.append(table(md[i:j])); i = j; continue
        elif l.startswith('- '):
            j, items = i, []
            while j < len(md) and md[j].startswith('- '): items.append(md[j][2:]); j += 1
            out.append('<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + '</ul>'); i = j; continue
        elif l.strip() and not l.startswith('---'):
            out.append(f'<p class="src">{inline(l)}</p>')
        i += 1
    return '\n'.join(out)

# ----------------------------------------------------------------------------- HTML
CSS = open(HERE / 'script_style.css', encoding='utf8').read()

toc, body, stats = [], [], []
total_words = total_sec = 0
for si, (name, role, slides) in enumerate(SPEAKERS):
    w = sum(nwords(' '.join(S[n][2])) for n in slides)
    sec = sum(S[n][1] for n in slides)
    total_words += w; total_sec += sec
    stats.append((name, w, sec, w / (sec / 60)))
    lo, hi = slides[0], slides[-1]
    toc.append(f'<li><a href="#sec{si}">{name} : {role} (slides {lo} à {hi})</a><ul>' + ''.join(f'<li><a href="#s{n}">{n}</a></li>' for n in slides) + '</ul></li>')
    body.append(f'<h1 id="sec{si}">{name} : {role} (slides {lo} à {hi})<span class="meta">{w} mots, {mmss(sec)}</span></h1>')
    for n in slides:
        title, secs, paras, notes, why = S[n]
        txt = ''.join(f'<p class="note">{esc(x)}</p>' for x in notes) + ''.join(f'<p>{esc(p)}</p>' for p in paras) + (why or '')
        body.append(f'<section class="row" id="s{n}"><div class="txt"><h2><span class="num">{n}</span>{esc(title)}<span class="t">{mmss(secs)}</span></h2>{txt}</div><figure class="sl"><img src="{img64(n)}" alt="Slide {n}" loading="lazy"></figure></section>')

toc.append('<li><a href="#secA">Annexes, pour les questions (slides 15 à 23)</a></li>')
toc.append('<li><a href="#secqa">Questions probables, faiblesses, glossaire, chiffres clés</a></li>')
body.append('<h1 id="secA">Annexes, pour les questions (slides 15 à 23)<span class="meta">hors temps de présentation</span></h1>')
for n, (title, text) in ANNEX.items():
    body.append(f'<section class="row" id="s{n}"><div class="txt"><h2><span class="num">{n}</span>{esc(title)}</h2><p>{esc(text)}</p></div><figure class="sl"><img src="{img64(n)}" alt="Slide {n}" loading="lazy"></figure></section>')
body.append('<h1 id="secqa">Questions probables et réponses<span class="meta">fondées sur les notebooks du projet</span></h1><section class="row full qa" id="qa"><div class="txt">' + qa_html() + '</div></section>')

sub = (f'Marketing Econometrics, TSE M2. Script à gauche, slide à droite. {total_words} mots, {mmss(total_sec)} au total, '
       f'réparti en trois parties de 5 minutes (Mathis, Nils, Antoine). Bouton « Mode récitation » en bas à droite : le script est flouté, '
       f'survolez ou touchez un paragraphe pour le révéler.')
doc = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Script de la soutenance, Marketing Econometrics, Projet 2</title><style>{CSS}</style></head><body>
<header><h1 class="title">Script de la soutenance, Projet 2 « Qui va racheter le mois prochain ? »</h1><p class="sub">{sub}</p>
<nav id="TOC"><ul>{''.join(toc)}</ul></nav></header>
<main>{''.join(body)}</main>
<button id="recite" aria-pressed="false" type="button">Mode récitation</button>
<script>
(function(){{var rows=document.querySelectorAll('.row');
var b=document.getElementById('recite');
b.addEventListener('click',function(){{var on=document.body.classList.toggle('recite');b.setAttribute('aria-pressed',on?'true':'false');
document.querySelectorAll('.txt p.shown').forEach(function(p){{p.classList.remove('shown')}});}});
document.addEventListener('click',function(e){{if(document.body.classList.contains('recite')&&e.target.closest('.txt p:not(.note)')){{e.target.closest('p').classList.toggle('shown')}}}});
if(!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){{es.forEach(function(e){{e.target.classList.toggle('on',e.isIntersecting&&e.intersectionRatio>0.35)}})}},{{threshold:[0.35]}});
rows.forEach(function(r){{io.observe(r)}});}})();
</script></body></html>'''
OUT.write_text(doc, encoding='utf8')
print('écrit', OUT, f'{OUT.stat().st_size/1e6:.1f} Mo')
for name, w, sec, wpm in stats: print(f'{name}: {w} mots, {mmss(sec)} alloués, {wpm:.0f} mots/min implicites')
print(f'Total {total_words} mots, {mmss(total_sec)} ; durée à {WPM} mots/min : {total_words / WPM:.1f} min')
