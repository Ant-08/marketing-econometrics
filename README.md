# Marketing Econometrics — TSE M2 (2025-2026)

Projets de groupe du cours *Marketing Econometrics* (Anna Blanpied, AVISIA).

| Projet | Sujet | Soutenance |
|---|---|---|
| [Project1](Project1/) | Segmentation RFM de la clientèle d'une marque de lingerie (« Feminiz ») et plan d'action sur un segment | 18/11/2026 |
| [Project2](Project2/) | Scoring de propension : qui rachète le mois prochain ? (compétition Kaggle, supermarché) | 25/11/2026 |

## Project 1 — Segmentation RFM et réactivation des « Decel »

Segment choisi : les **Decel**, clientes à fréquence et montant moyens ou élevés mais sans achat depuis plus de 150 jours (806 clientes, 7 % du CA). Livrable : un deck de 15 minutes pour le comité de pilotage marketing.

### Contenu

| Fichier | Rôle |
|---|---|
| `Notebook_project1_completed.ipynb` | Notebook du TP complété : jointures, nettoyage, indicateurs, segmentation RFM (règles du cours, slides 24-26). Reproduit toutes les valeurs de contrôle et les volumes de référence. |
| `Analyse_Decel.ipynb` | Analyse approfondie du segment : poids, profil comparé, historique avant la période, gammes de produits, arbre de décision (annexe). |
| `Migration.ipynb` | Bonus : segmentation recalculée sur sept. 2014 – août 2015 et matrice de migration vers 2015-16. |
| `Recommandations.ipynb` | Leviers chiffrés, backtest de l'alerte, dimensionnement du test A/B, scénarios économiques, plan d'action priorisé. |
| `figures/` | Graphiques produits par les notebooks. |
| `Feminiz_RFM_Decel.pptx` | Deck de présentation (graphiques natifs, notes de présentation minutées). |
| `deck/` | Script `pptxgenjs` qui génère le deck. |

### Ré-exécuter

1. Placer les 6 fichiers CSV fournis dans `Project1/Data/` (`CUSTOMER`, `CUSTOMER_ADDITIONAL`, `PRODUCTS`, `RECEIPTS`, `REFERENTIAL`, `STORE`). Ils ne sont pas versionnés.
2. Installer les dépendances : `pip install pandas numpy seaborn matplotlib scikit-learn statsmodels jupyter`.
3. Exécuter depuis `Project1/`, dans l'ordre : `Notebook_project1_completed` → `Analyse_Decel` → `Migration` → `Recommandations`. Chaque notebook ré-exécute le précédent avec `%run`, donc chacun peut aussi être lancé seul.

Régénérer le deck (Node.js requis) :

```bash
cd Project1/deck
npm install pptxgenjs
node build_deck.js ../Feminiz_RFM_Decel.pptx ../figures
```

### Principaux résultats

- 12 340 clientes actives sur sept. 2015 – août 2016 ; Top et Good = 29 % des clientes et 46 % du CA.
- Decel : 283 € par cliente et par an, panier moyen le plus élevé des clientes fidèles (117 €).
- Avant la période, elles étaient déjà moins présentes au printemps-été (59 % contre 70 à 77 %) et avaient moins adopté le bain (41 % contre 53 à 59 %).
- Statut transitoire : un an plus tard, environ un tiers remonte en Top/Good et un tiers devient inactif.
- Plan : relance de rentrée et de printemps, alerte graduée sur les Good qui tardent à racheter, découverte du bain, récompenses sans remise, mesure contre un groupe témoin de 30 %.

## Project 2 — Qui va racheter le mois prochain ?

Prédire quels clients d'une chaîne de supermarchés rachètent en août 2020 (score de propension, métrique AUC, 10 % de la base ciblable), puis recommander des actions sur un segment. Livrable : un deck de 15 minutes et la compétition Kaggle.

### Contenu

| Fichier | Rôle |
|---|---|
| `common.py`, `features.py`, `segments.py` | Socle partagé : chargement et nettoyage, plis de validation croisée, construction des variables, segmentation RFM. |
| `01_Data_Overview.ipynb` | Exploration et décisions de nettoyage. |
| `02_Feature_Engineering.ipynb` | Environ 100 variables par client (récence, fréquence, montant, rythme, saisonnalité…). |
| `03_Modeles_Baselines.ipynb` | Règles (récence, RFM), régressions logistiques, arbre, k-NN, Naive Bayes. |
| `04_Modeles_Arbres_Boosting.ipynb` | Forêt aléatoire, XGBoost, LightGBM, réglage, ablation par famille de variables. |
| `05_Segmentation.ipynb` | RFM à 7 segments, ACP, K-Means, CAH, choix du segment. |
| `06_Modele_Final.ipynb` | Modèle final, courbes de gain, SHAP, robustesse. |
| `07_Recommandations_Marketing.ipynb` | Ciblage du top 10 %, segment « Good », scénarios économiques (hypothèses), test A/B. |
| `results/`, `figures/` | Tableaux et graphiques produits par les notebooks (`results/0N_summary.md` : synthèse de chaque notebook). |
| `deck/` | Deck (`Projet2_Repurchase.pptx`, généré par `build.js` avec `pptxgenjs`), script d'oral à trois voix, questions probables. |

### Ré-exécuter

1. Placer les CSV Kaggle dans `Project2/Data/` (non versionnés). Les intermédiaires lourds vont dans `~/.cache/marketing-econometrics/project2/`.
2. Dépendances : `pandas numpy pyarrow scikit-learn lightgbm xgboost shap statsmodels scipy matplotlib seaborn jupyter`.
3. Exécuter dans l'ordre 01 → 07 depuis `Project2/`.

### Principaux résultats (validation croisée 5 plis)

- La récence seule donne une AUC de 0,818 ; la régression logistique Lasso 0,871 ; le LightGBM réglé 0,8785.
- En ciblant 10 % de la base : précision 40,6 %, rappel 52,6 %, lift 5,26 (taux moyen de rachat : 7,7 %).
- Limite assumée : la part d'achats le week-end pèse beaucoup et août 2020 commence un samedi (effet de calendrier possible, un seul mois cible).
- Segment recommandé : « Good » ; à une remise de 10 %, aucune stratégie n'est rentable au scénario central (hypothèses), d'où un test A/B.
