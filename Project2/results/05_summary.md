# Résumé du notebook 05 : segmentation RFM et clustering

## Chiffres clés (train, rachat = achat en août 2020 ; base 7,72 %)
- **Règle RFM** (`segments.assign_rfm`, seuils métier) : Inactive (> 180 j sans achat) et New (1er ticket < 90 j) d'abord ; puis R (≤ 14 j / 15-60 j / 61-180 j), F (≤ 5 / 6-24 / ≥ 25 tickets), M (≤ 150 € / 151-1 000 € / > 1 000 €) ; grille FM de la slide 24 ; 9 cases regroupées en Top, Good, Decel, Small, Weak.
- **Deux approches de seuils** comparées : mêmes étiquettes pour 81 % des clients, même ordre de rachat ; seuils métier retenus (lisibles, stables). Tertiles du train : R ≤ 8 / 45 j, F ≤ 9 / 27, M ≤ 335 / 1179 €.
- **Top** : 44 630 clients (28 %), 68 % du CA, rachat 21,2 % (lift 2,74), 76 % des rachats, 61 % avec e-mail.
- **Good** : 24 203 clients (15 %), 17 % du CA, rachat 6,5 % (lift 0,85), 13 % des rachats, 58 % avec e-mail.
- **Decel** : 13 016 clients (8 %), 7 % du CA, rachat 1,8 % (lift 0,24), 2 % des rachats, 56 % avec e-mail.
- **Small** : 11 224 clients (7 %), 1 % du CA, rachat 2,9 % (lift 0,38), 3 % des rachats, 50 % avec e-mail.
- **Weak** : 16 818 clients (10 %), 1 % du CA, rachat 0,8 % (lift 0,11), 1 % des rachats, 50 % avec e-mail.
- **New** : 9 995 clients (6 %), 1 % du CA, rachat 4,6 % (lift 0,59), 4 % des rachats, 54 % avec e-mail.
- **Inactive** : 40 538 clients (25 %), 5 % du CA, rachat 0,5 % (lift 0,06), 2 % des rachats, 49 % avec e-mail.
- **Clustering** : 9 variables de comportement, ACP (6 axes, 83 % de variance), K-Means k = 6 (silhouette 0,17, stabilité ARI 0,97), CAH de Ward sur 6 000 clients (ARI avec K-Means 0,34). Classes : C1 Réguliers (24 %, rachat 20,2 %) ; C2 Petits paniers (20 %, rachat 1,3 %) ; C3 Montants (20 %, rachat 9,8 %) ; C4 Paniers premium (16 %, rachat 1,1 %) ; C5 Soirée (11 %, rachat 1,6 %) ; C6 Week-end (10 %, rachat 3,0 %).
- **Réaffectation** : arbre de profondeur 4, exactitude 76 % en validation croisée (logistique : 94 %, meilleure pour affecter ; l'arbre sert à lire les règles).
- **AUC des segmentations** (rachat) : récence seule 0,818 ; RFM 7 segments 0,807 ; classes 0,781 ; RFM × classes 0,829.
- **Segment recommandé : Good** (17 486 e-mailables, rachat 6,5 %, 13 % des rachats, 8,1 mois actifs sur 12). Test A/B (témoin 30 %) : effet minimal détectable 1,2 pt (18 % relatif). Candidats : Good, C3 Montants. Top et Réguliers : acquis (C3).

## Figures (figures/05_*.png)
- `05_regles_new_inactive` : au-delà de 180 jours sans achat le rachat s'effondre ; les clients récents forment un groupe à part.
- `05_seuils_rfm` : seuils métier et tertiles sur les distributions de R, F, M.
- `05_grille_rfm27` : les 27 combinaisons R × F × M, leurs effectifs et leur rachat, regroupés en 9 cases puis en segments.
- `05_poids_segments` : Top = 28 % des clients, 68 % du CA, 76 % des rachats.
- `05_rachat_segments` : rachat par segment avec intervalle de confiance.
- `05_profil_segments` : profil indexé : le panier varie peu, la fréquence énormément.
- `05_acp` : variance expliquée et cercles des corrélations.
- `05_coude_silhouette` : pas de coude net, silhouette basse et plate : un continuum.
- `05_dendrogramme` : CAH de Ward sur échantillon, coupe à 6 classes.
- `05_radar_classes`, `05_plan_factoriel`, `05_classes_poids_rachat` : profils, plan factoriel et rachat des 6 classes.
- `05_arbre_reallocation` : règles pour affecter un nouveau client à une classe.
- `05_rfm_vs_classes` : composition croisée RFM × classes et rachat par case.
- `05_candidats` : bulle taille / rachat / CA et effet minimal détectable des 13 segments.

## Décisions méthodologiques
- Seuils métier par défaut, tertiles en contrôle ; Inactive et New traités avant la notation (slide 26, Projet 1). Aucune variable construite avec la cible ; le rachat ne sert qu'à décrire.
- Clustering sur 9 variables de comportement (slide 38), standardisées, ACP à 80 % de variance, K-Means sur les axes ; k = 6 choisi pour l'interprétation (silhouette plate). CAH sur échantillon (ne passe pas à l'échelle).
- Critères de sélection fixés avant le classement : taille A/B et « pas déjà acquis » éliminatoires.

## Limites et pistes
- La segmentation décrit, elle n'est pas causale : un taux de rachat n'est pas un effet de la remise ; seul un test A/B le mesure. Un seul mois cible, une seule coupure.
- La cible est étroite (≈ 2 jours d'activité) : le rachat sous-estime l'activité mensuelle ; la part de « déjà acquis » est donc plus grande qu'il n'y paraît.
- Silhouette basse : les classes découpent un continuum. New peut contenir d'anciens clients qui reviennent (historique de 12 mois). 45 % des clients sans e-mail.
- Pistes : croiser avec les scores (notebook 07), ACM sur variables qualitatives, segmentation sur plusieurs coupures, données ouvertes.
