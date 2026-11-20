# Brief commun — deck de l'oral (Projet 2)

## Contexte
Oral de 15 min + questions, mercredi 25/11/2026 (jury : Anna Blanpied / AVISIA). Slides à rendre dimanche 22/11 23:59.
Sujet : prédire quels clients d'une chaîne de supermarchés vont racheter en août 2020 (score de propension ; Kaggle, AUC ; le marketing ne peut cibler que 10 % de la base). L'oral doit contenir des recommandations marketing sur UN segment. L'audience est un jury marketing/économétrie : message clair, chiffres justes, méthodologie du cours (pas de techniques hors cours mises en avant).
Le Projet 1 (Feminiz, lingerie, RFM, segment « Decel ») a déjà été présenté dans le même style : on garde l'esprit épuré, avec une palette verte (supermarché).

## Sources de vérité (lire, ne rien inventer)
Tout se trouve dans `../` (= Project2/) : `results/01_summary.md … 07_summary.md`, les CSV/JSON `results/0N_*`, `figures/0N_*.png` (palette orange/bleu des notebooks : à ne PAS réutiliser telles quelles, redessiner en vert si besoin), `BRIEF_COMMUN.md`, les notebooks 01-07.
- Chaque chiffre affiché sur une slide doit venir d'un fichier `results/` (cite-le en source de bas de slide ou dans les notes).
- Ce qui est une hypothèse (€, taux d'usage de la remise, marge…) doit être étiqueté « hypothèse » sur la slide.
- Le score Kaggle (leaderboard) n'est PAS encore connu : n'écris jamais de score Kaggle. Si une slide en a besoin, laisse un encart libellé exactement `[score Kaggle à insérer]`.
- Propension ≠ effet causal : cibler les plus probables n'est pas cibler les plus influençables. Le dire là où c'est pertinent.
- Fil rouge honnête : l'effet de calendrier (part d'achats le week-end, août 2020 commence un samedi) est à mentionner comme limite.

## Fil narratif et découpage (14 slides principales ≈ 15 min, + annexes)
| # | Slide | Section | Temps cumulé visé |
|---|---|---|---|
| 1 | Titre | s1 | 0:00–0:15 |
| 2 | Contexte et enjeu (supermarché, 10 % de la base, pont avec le Projet 1) | s1 | → 0:55 |
| 3 | Données et construction de la cible (frise : historique 08/2019–07/2020 → cible août 2020 ; 160 424 clients train, 7,72 % de racheteurs ; test 40 106 ; nettoyages clés) | s1 | → 1:45 |
| 4 | Ce que disent les données : la récence explique l'essentiel (taux de rachat par classe de récence) | s1 | → 2:35 |
| 5 | Les variables construites (familles R/F/M, rythme, saisonnalité…) et garde-fous (pas de fuite temporelle) | s1 | → 3:30 |
| 6 | Démarche de modélisation : du plus simple au plus riche, validation croisée 5 plis ; AUC par modèle | s2 | → 4:45 |
| 7 | Résultat final : LightGBM, gain/lift, top 10 % (précision, rappel), déciles | s2 | → 6:15 |
| 8 | Ce qui explique le rachat : SHAP + profil racheteur vs non-racheteur | s2 | → 7:30 |
| 9 | Robustesse et limites : écart-type entre plis, calibration, ablation, risque calendrier week-end | s2 | → 8:30 |
| 10 | Segmentation : RFM (7 segments) et clustering (K-Means/CAH) | s3 | → 9:45 |
| 11 | Le segment choisi : « Good » (pourquoi lui, comparaison aux candidats, ce que dit le score dedans) | s3 | → 11:00 |
| 12 | Plan d'action sur « Good » : persona, leviers, message, canal, calendrier | s3 | → 12:30 |
| 13 | Combien ça peut rapporter et comment le mesurer : scénarios (hypothèses étiquetées), seuils de rentabilité, test A/B | s3 | → 14:00 |
| 14 | Conclusion et prochaines étapes (+ encart `[score Kaggle à insérer]`) | s3 | → 15:00 |
| A | Annexes : intercalaire + 6 à 8 slides techniques (annexes.js) | annexes | hors temps |

## Thème (déjà prêt) : `deck/theme.js`
`const { pres, C, FONT, W, M, base, dark, card, chip, stat, bullets, takeaway, img, hiBar, pctFmt, fr } = T;`
- Palette `C` : DEEP (fond sombre), GREEN (principal), LEAF, MINT, TINT (cartes), ORANGE (accent, parcimonie : 1 élément mis en avant par slide), SLATE/SLATE2 (comparaison), INK, MUTED, GREY, WHITE. Polices `FONT.HEAD` (Georgia) / `FONT.BODY` (Calibri).
- `T.base(kicker, titre, {source})` crée une slide de contenu ; le TITRE EST UN MESSAGE (une phrase qui dit la conclusion, ≤ 2 lignes à 26 pt). `T.dark()` crée une slide sombre (titre, intermède, clôture). `T.takeaway(s, texte)` pose le bandeau « à retenir » en bas (y = 6,2). Zone utile : y de 1,5 à 6,1 (ou 6,9 sans bandeau), x de 0,6 à 12,73.
- Style : épuré, beaucoup de blanc, 1 idée par slide, pas de mur de texte (≥ 12 pt, idéalement 14-15), pas de décoration inutile. Graphiques : natifs pptxgenjs quand c'est simple (barres, courbes : `pres.charts.BAR/LINE`, couleurs du thème, pas de grille, valeurs en étiquettes) ; sinon image PNG matplotlib dessinée aux couleurs du thème.
- Espaces insécables français gérés par `fr()` automatiquement sur les textes.

## Ce que livre chaque agent
Un module `deck/sections/<nom>.js` : `module.exports = (T) => { ... }` qui ajoute ses slides dans l'ordre (via `T.base` / `T.dark`). Aucune autre modification de `theme.js` / `build.js` (si tu as besoin d'une brique commune, définis-la localement dans ton module et signale-la). Chaque slide a des NOTES D'ORAL (`s.addNotes("[m:ss] …")`), en français, première personne du pluriel (« nous »), 2-5 phrases dites à voix haute, avec les chiffres exacts et la transition vers la slide suivante ; respecte le temps cumulé visé.
Figures PNG créées pour le deck : `deck/figs/<nom_section>_<nom>.png` (script `deck/make_figs_<section>.py`, python du venv `~/.venvs/marketing-econometrics/bin/python`, palette du thème en hex, `figure.dpi` 200, fond blanc, pas de titre redondant avec celui de la slide).

## Exécution et contrôle visuel (OBLIGATOIRE)
```bash
export NODE_PATH=$HOME/.cache/marketing-econometrics/deck_node/node_modules
cd "<Project2>/deck"
node build.js "$SCRATCH/test_<section>.pptx" <section>          # construit seulement ta section
cd "$SCRATCH" && soffice --headless --convert-to pdf test_<section>.pptx && pdftoppm -r 60 -png test_<section>.pdf pg_<section>
```
puis ouvre chaque PNG avec l'outil Read et corrige : texte qui déborde, chevauchements, graphique illisible, contraste. LibreOffice n'a pas Calibri (police de substitution plus large) : si ça tient à l'écran, ça tient dans PowerPoint/Google Slides. Itère jusqu'à ce que chaque slide soit propre. `$SCRATCH` = le dossier scratchpad de la session (donné dans ton prompt).

## Règles de dépôt
- Le dossier du projet est sous Google Drive : jamais de `node_modules`, `.venv`, `__pycache__` ni `.ipynb_checkpoints` dedans. Python avec `PYTHONPYCACHEPREFIX=$HOME/.cache/pycache MPLCONFIGDIR=$HOME/.cache/matplotlib`.
- Ne modifie pas `common.py`, `features.py`, `segments.py`, les notebooks ni `results/`. Ne commite rien. N'envoie rien à Kaggle.
- Sois économe en jetons : lis ce qu'il faut (les `*_summary.md` d'abord), ne relis pas les notebooks entiers.
- Rapport final (court) : slides produites (numéro, titre), fichiers créés, chiffres clés utilisés et leur source, incohérences trouvées entre fichiers, ce qui reste à faire.
