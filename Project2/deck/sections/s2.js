// Section 2 : modélisation (slides 6 à 9). Figures : deck/figs/s2_*.png (script make_figs_s2.py).
// Sources des chiffres : results/03_model_comparison.csv, 04_model_comparison.csv, 06_topk_metrics.csv, 06_deciles.csv,
// 06_shap_importance.csv, 06_profil_racheteur.csv, 06_robustesse_plis.csv, 06_calibration.csv, 06_diagnostic_calendrier.json.
const path = require('path');

module.exports = (T) => {
  const { pres, C, FONT, W, M, base, card, stat, bullets, takeaway, img } = T;
  const FIG = (n) => path.join(__dirname, '..', 'figs', n);
  const R = pres.shapes.RECTANGLE;

  // ============================================================ Slide 6 : démarche de modélisation
  {
    const s = base('Modélisation',
      'Du plus simple au plus riche : après la logistique, la complexité ne rapporte que 0,007 d’AUC de plus',
      { source: 'Source : results/03_model_comparison.csv et 04_model_comparison.csv (AUC hors-échantillon, validation croisée 5 plis communs ; modèles réglés par grid ou random search).' });
    img(s, FIG('s2_echelle_auc.png'), M, 1.55, 8.3, 4.5);
    card(s, 9.2, 1.55, 3.53, 4.5);
    s.addText('CE QUE RAPPORTE CHAQUE ÉTAPE', { x: 9.45, y: 1.7, w: 3.1, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 1, margin: 0, isTextBox: true });
    stat(s, 9.45, 2.05, 3.1, '0,053', 'd\u2019AUC gagnée de la récence seule à la logistique Lasso (0,818 → 0,871)', C.GREEN, 34);
    stat(s, 9.45, 3.5, 3.1, '0,007', 'd\u2019AUC gagnée de la logistique à LightGBM (0,871 → 0,879)', C.ORANGE, 34);
    s.addText('Mêmes 5 plis pour tous les modèles ; le test ne sert à aucune décision.', { x: 9.45, y: 5.05, w: 3.1, h: 0.8, fontFace: FONT.BODY, fontSize: 12, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
    takeaway(s, 'La complexité rapporte peu après la logistique : +0,007 d’AUC, mais LightGBM fait mieux dans les 5 plis.');
    s.addNotes('[3:30] Pour prédire le rachat d’août, nous avons procédé du plus simple au plus riche, avec exactement les mêmes 5 plis de validation croisée pour tous les modèles, donc des AUC comparables et calculées hors échantillon. ' +
      'Première marche : des règles sans modèle. La récence seule donne une AUC de 0,818 ; le score RFM du cours, 0,841. Deuxième marche : la logistique pénalisée, Lasso, qui monte à 0,871, soit +0,053 : c’est le plus gros saut de toute l’échelle. ' +
      'Troisième marche : arbre, k plus proches voisins et Naive Bayes, entre 0,859 et 0,864, donc moins bons que la logistique. Quatrième marche : forêt aléatoire, XGBoost et LightGBM réglés, de 0,875 à 0,8785. ' +
      'Le message : après la logistique, la complexité rapporte peu, +0,007 d’AUC. Les barres d’erreur, un écart-type entre plis d’environ 0,002, montrent que les modèles de la dernière marche sont proches entre eux. ' +
      'Nous retenons quand même LightGBM, parce qu’il gagne dans les 5 plis contre le Lasso, qui reste notre référence lisible. Voyons ce que donne le modèle final.');
  }

  // ============================================================ Slide 7 : résultat final
  {
    const s = base('Modélisation',
      'Le modèle final, LightGBM, capte 52,6 % des racheteurs en ne ciblant que 10 % de la base',
      { source: 'Source : results/06_topk_metrics.csv, 06_deciles.csv, 06_robustesse_plis.csv ; scores hors-échantillon, 160 424 clients ; top 10 % = 16 042 clients ; base = 7,7 % de racheteurs.' });
    const xs = [M, M + 3.1, M + 6.2, M + 9.3];
    stat(s, xs[0], 1.45, 2.85, '0,8785', 'AUC en validation croisée (écart-type entre plis 0,0022)', C.GREEN, 32);
    stat(s, xs[1], 1.45, 2.85, '40,6 %', 'précision du top 10 % : 4 clients ciblés sur 10 rachètent', C.GREEN, 32);
    stat(s, xs[2], 1.45, 2.85, '52,6 %', 'rappel : part des racheteurs captés par 10 % de la base', C.GREEN, 32);
    stat(s, xs[3], 1.45, 2.85, '5,26', 'lift : 40,6 % de rachat contre 7,7 % au hasard', C.ORANGE, 32);
    img(s, FIG('s2_roc_gain_deciles.png'), M + (12.13 - 9.7) / 2, 2.85, 9.7, 3.3);
    takeaway(s, 'Ciblés à 10 %, 4 clients sur 10 rachètent. C’est une probabilité de rachat, pas un effet de la campagne.');
    s.addNotes('[4:45] Voici le résultat du modèle final, LightGBM réglé : une AUC de 0,8785 en validation croisée, avec un écart-type entre plis de 0,0022. ' +
      'Mais l’enjeu métier est la contrainte des 10 % : le marketing ne peut contacter que 16 042 clients. Dans ce top 10 %, la précision est de 40,6 % : quatre clients ciblés sur dix rachètent, contre 7,7 % dans la base, soit un lift de 5,26. ' +
      'Le rappel est de 52,6 % : en contactant 10 % de la base, nous touchons plus de la moitié des racheteurs ; la règle de récence seule n’en capte que 30,4 %, le Lasso 50,9 %. ' +
      'À droite, les déciles : le premier rachète à 40,6 %, le dernier à 0,3 %, et les cinq derniers déciles ne contiennent que 5 % des racheteurs. ' +
      'Une précision : ce score est une probabilité de rachat. Cibler les plus probables n’est pas cibler les plus influençables : l’effet incrémental de l’action se mesurera par un test A/B, nous y reviendrons. Reste à comprendre ce qui explique ces scores.');
  }

  // ============================================================ Slide 8 : SHAP + profil racheteur
  {
    const s = base('Modélisation',
      'Les racheteurs sont des clients récents et fréquents ; la part d’achats le week-end pèse aussi',
      { source: 'Source : results/06_shap_importance.csv (SHAP sur 10 000 clients, explications hors-pli) et 06_profil_racheteur.csv (moyennes ; racheteurs vs non-racheteurs d’août).' });
    // gauche : SHAP
    s.addText('Ce qui pèse dans le score (SHAP, 10 premières variables)', { x: M, y: 1.5, w: 6.8, h: 0.35, fontFace: FONT.BODY, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    img(s, FIG('s2_shap.png'), M, 1.9, 6.8, 3.64);
    s.addText([
      { text: '↑', options: { bold: true, color: C.GREEN } }, { text: ' plus la valeur est haute, plus le rachat est probable ;  ' },
      { text: '↓', options: { bold: true, color: C.SLATE } }, { text: ' moins probable.  ' },
      { text: 'Orange', options: { bold: true, color: C.ORANGE } }, { text: ' : variable de calendrier (voir robustesse).' },
    ], { x: M, y: 5.62, w: 6.8, h: 0.45, fontFace: FONT.BODY, fontSize: 11, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
    // droite : profil
    const X0 = 7.75, WR = W - M - X0;
    card(s, X0 - 0.2, 1.5, WR + 0.2, 4.6);
    s.addText('Le profil du racheteur d’août (moyennes)', { x: X0, y: 1.6, w: WR - 0.2, h: 0.35, fontFace: FONT.BODY, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    // légende
    s.addShape(R, { x: X0, y: 2.1, w: 0.2, h: 0.2, fill: { color: C.GREEN }, line: { color: C.GREEN } });
    s.addText('Racheteurs', { x: X0 + 0.28, y: 2.05, w: 1.4, h: 0.3, fontFace: FONT.BODY, fontSize: 12, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    s.addShape(R, { x: X0 + 1.8, y: 2.1, w: 0.2, h: 0.2, fill: { color: C.SLATE2 }, line: { color: C.SLATE2 } });
    s.addText('Non-racheteurs', { x: X0 + 2.08, y: 2.05, w: 1.8, h: 0.3, fontFace: FONT.BODY, fontSize: 12, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    const rows = [
      { lab: 'Dernier achat il y a…', a: 14.596, b: 107.072, ta: '15 jours', tb: '107 jours' },
      { lab: 'Tickets sur les 60 derniers jours', a: 11.396, b: 2.373, ta: '11,4', tb: '2,4' },
      { lab: 'Part des achats faits le week-end', a: 31.9, b: 25.4, ta: '32 %', tb: '25 %' },
    ];
    const BW = 2.6; // largeur max d'une barre
    rows.forEach((r, i) => {
      const y = 2.55 + i * 1.18;
      s.addText(r.lab, { x: X0, y, w: WR - 0.2, h: 0.3, fontFace: FONT.BODY, fontSize: 13, bold: true, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
      const mx = Math.max(r.a, r.b);
      [[r.a, r.ta, C.GREEN, C.GREEN], [r.b, r.tb, C.SLATE2, C.SLATE]].forEach(([v, t, col, tc], j) => {
        const by = y + 0.36 + j * 0.34, bw = Math.max(0.08, BW * v / mx);
        s.addShape(R, { x: X0, y: by, w: bw, h: 0.26, fill: { color: col }, line: { color: col } });
        s.addText(t, { x: X0 + bw + 0.1, y: by - 0.02, w: 1.3, h: 0.3, fontFace: FONT.BODY, fontSize: 14, bold: true, color: tc, margin: 0, valign: 'middle', isTextBox: true });
      });
    });
    takeaway(s, 'Le rachat se lit dans la récence et la fréquence ; le week-end est le seul signal de calendrier du top 5.');
    s.addNotes('[6:15] Que dit le modèle ? À gauche, l’importance SHAP : cinq variables portent 44 % de l’importance. Ce sont la part des achats le week-end, le nombre de jours depuis l’avant-dernier achat, les tickets sur 60 jours, les jours depuis le dernier achat, et les tickets sur 180 jours. ' +
      'Les flèches donnent le sens : plus le client est récent et fréquent, plus son rachat est probable. Ce sens est le même que dans la logistique du notebook 3 pour 14 variables comparables sur 15, ce qui rassure sur la cohérence entre les deux modèles. ' +
      'À droite, le profil concret : le racheteur d’août a acheté il y a 15 jours en moyenne, contre 107 pour les autres ; il a 11,4 tickets sur 60 jours contre 2,4 ; et fait 32 % de ses achats le week-end contre 25 %. ' +
      'Un point nous préoccupe : la part de week-end arrive en tête du SHAP. Est-ce un vrai comportement ou un effet de calendrier ? C’est le sujet de la slide suivante, sur la robustesse.');
  }

  // ============================================================ Slide 9 : robustesse et limites
  {
    const s = base('Modélisation',
      'Le modèle est stable et bien calibré ; l’effet de calendrier du week-end reste un point de vigilance',
      { source: 'Source : results/06_robustesse_plis.csv, 06_calibration.csv, 06_diagnostic_calendrier.json, 06_key_numbers.json.' });
    const CY = 1.5, CH = 4.6;
    const cards = [{ x: M, w: 3.6 }, { x: M + 3.77, w: 3.6 }, { x: M + 7.54, w: 4.59 }];
    cards.forEach(c => card(s, c.x, CY, c.w, CH));
    const head = (c, t, col = C.GREEN) => s.addText(t, { x: c.x + 0.18, y: CY + 0.12, w: c.w - 0.36, h: 0.35, fontFace: FONT.BODY, fontSize: 14, bold: true, color: col, margin: 0, valign: 'middle', isTextBox: true });
    // 1 : stabilité
    head(cards[0], '1. Stable d’un pli à l’autre');
    img(s, FIG('s2_plis.png'), cards[0].x + 0.25, CY + 0.55, 3.1, 2.3);
    bullets(s, [
      'Écart-type entre plis : 0,0022',
      'AUC de 0,8757 à 0,8818 ; devant le Lasso dans les 5 plis',
      'Un peu optimiste : réglage sur les mêmes plis',
    ], cards[0].x + 0.18, CY + 2.95, cards[0].w - 0.36, 1.6, 12);
    // 2 : calibration
    head(cards[1], '2. Bien calibré');
    img(s, FIG('s2_calibration.png'), cards[1].x + 0.25, CY + 0.55, 3.1, 2.3);
    bullets(s, [
      'Score moyen = 1,00 × le taux réel (pente 1,01)',
      'Écart moyen de 0,07 point par décile',
      'Seul le classement est utilisé : la cible est plus étroite que « acheter dans le mois »',
    ], cards[1].x + 0.18, CY + 2.95, cards[1].w - 0.36, 1.6, 12);
    // 3 : calendrier
    const c3 = cards[2];
    head(c3, '3. Point de vigilance : le week-end', C.ORANGE);
    s.addText('0,8785 → 0,8728', { x: c3.x + 0.18, y: CY + 0.55, w: c3.w - 0.36, h: 0.55, fontFace: FONT.HEAD, fontSize: 26, bold: true, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    s.addText('AUC sans la part d’achats le week-end et le samedi (perte de 0,0058) : le modèle tient', { x: c3.x + 0.18, y: CY + 1.12, w: c3.w - 0.36, h: 0.5, fontFace: FONT.BODY, fontSize: 12, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
    // mini-calendrier d'août 2020 (1er août = samedi)
    const cx = c3.x + 0.2, cy = CY + 1.95, cw = 0.33, ch = 0.3;
    s.addText('Août 2020', { x: cx, y: cy, w: cw * 7, h: 0.28, fontFace: FONT.BODY, fontSize: 12, bold: true, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((d, k) => s.addText(d, { x: cx + k * cw, y: cy + 0.3, w: cw, h: 0.24, fontFace: FONT.BODY, fontSize: 10, color: C.MUTED, align: 'center', valign: 'middle', margin: 0, isTextBox: true }));
    for (let d = 1; d <= 31; d++) {
      const idx = 5 + d - 1, col = idx % 7, row = Math.floor(idx / 7), we = col >= 5;
      s.addText(String(d), { x: cx + col * cw + 0.015, y: cy + 0.56 + row * ch, w: cw - 0.03, h: ch - 0.03, fontFace: FONT.BODY, fontSize: 10, bold: we, color: we ? C.WHITE : C.INK,
        fill: { color: we ? C.ORANGE : C.WHITE }, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    }
    s.addText([
      { text: 'Août 2020 commence un samedi : ', options: { bold: true } },
      { text: '10 jours de week-end sur 31 (32,3 %), contre 29,0 % en août 2019.', options: { breakLine: true } },
      { text: 'Avec un seul mois cible, l’effet de calendrier ne peut pas être exclu.' },
    ], { x: c3.x + 0.2 + cw * 7 + 0.2, y: cy, w: c3.w - 0.2 - cw * 7 - 0.2 - 0.15, h: 2.5, fontFace: FONT.BODY, fontSize: 12, color: C.INK, margin: 0, valign: 'top', paraSpaceAfter: 6, isTextBox: true });
    takeaway(s, 'Stable et calibré, mais la part de week-end n’est pas validée : à tester en multi-coupures avant un usage mensuel.');
    s.addNotes('[7:30] Trois contrôles sur ce résultat, dont une limite que nous assumons. Un : la stabilité. L’AUC varie de 0,8757 à 0,8818 selon le pli, avec un écart-type de 0,0022, et LightGBM bat le Lasso dans les cinq plis. Elle reste un peu optimiste, car le réglage utilise les mêmes plis que l’évaluation. ' +
      'Deux : la calibration. Le score moyen est égal à 1,00 fois le taux réel, avec une pente de 1,01 : les scores sont de vraies probabilités, même si nous n’utilisons que le classement. ' +
      'Trois, la limite : la part d’achats le week-end. Sans elle et sans la part de samedi, l’AUC passe de 0,8785 à 0,8728, soit 0,0058 de perte : le modèle tient. Mais août 2020 commence un samedi et compte 10 jours de week-end sur 31, 32,3 %, contre 29,0 % en août 2019. ' +
      'Avec un seul mois cible, nous ne pouvons pas dire si cette variable capte un comportement durable ou un effet de calendrier. Pour un usage mensuel, il faudrait un test multi-coupures. Cela ne remet pas en cause le ciblage d’août, mais nous ne l’extrapolons pas. ' +
      'Voilà pour la modélisation, en 8 minutes 30 ; place à la segmentation et à la recommandation marketing.');
  }
};
