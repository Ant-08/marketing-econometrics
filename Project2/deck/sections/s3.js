// Section 3 (slides 10 à 14) : segmentation, segment Good, plan d'action, scénarios et test A/B, conclusion.
// Sources : results/05_*.csv/json/md, results/07_*.csv/json/md, results/06_key_numbers.json (voir sources de bas de slide).
// Aucune figure PNG : tout est dessiné en formes et graphiques natifs pptxgenjs aux couleurs du thème.
module.exports = (T) => {
  const { pres, C, FONT, W, M, base, dark, card, stat, bullets, takeaway, hiBar } = T;
  const SH = pres.shapes;

  // ---- briques locales
  const txt = (s, text, o) => s.addText(text, Object.assign({ fontFace: FONT.BODY, fontSize: 13, color: C.INK, margin: 0, valign: 'top', isTextBox: true }, o));
  const rect = (s, x, y, w, h, color) => s.addShape(SH.RECTANGLE, { x, y, w, h, fill: { color }, line: { color } });
  // Bandeau « hypothèse » : étiquette orange à poser à côté de tout chiffre supposé
  const tag = (s, x, y, label = 'HYPOTHÈSE', w = 1.25) => {
    s.addShape(SH.ROUNDED_RECTANGLE, { x, y, w, h: 0.3, fill: { color: C.ORANGE }, line: { color: C.ORANGE }, rectRadius: 0.06 });
    txt(s, label, { x, y, w, h: 0.3, fontSize: 10.5, bold: true, color: C.WHITE, align: 'center', valign: 'middle', charSpacing: 1 });
  };

  // =====================================================================================
  // SLIDE 10 : Segmentation (RFM 7 segments + clustering)
  // =====================================================================================
  {
    const s = base('Segmentation', 'Le RFM isole sept segments très contrastés ; le clustering ne fait que redécouper un continuum', {
      source: 'Sources : results/05_segment_profiles.csv (train, 160 424 clients ; rachat de base 7,72 %), 05_cluster_profiles.csv, 05_segment_definitions.json, 05_summary.md.',
    });
    const seg = [
      ['Top', '44 630', 28, 68, 21.2],
      ['Good', '24 203', 15, 17, 6.5],
      ['Decel', '13 016', 8, 7, 1.8],
      ['Small', '11 224', 7, 1, 2.9],
      ['Weak', '16 818', 10, 1, 0.8],
      ['New', '9 995', 6, 1, 4.6],
      ['Inactive', '40 538', 25, 5, 0.5],
    ];
    const x0 = 0.6, yH = 1.55, y0 = 1.95, rh = 0.52;
    const hd = { fontSize: 11, bold: true, color: C.MUTED };
    txt(s, 'SEGMENT', Object.assign({ x: x0 + 0.15, y: yH, w: 1.1, h: 0.3 }, hd));
    txt(s, 'CLIENTS', Object.assign({ x: 1.95, y: yH, w: 1.7, h: 0.3 }, hd));
    txt(s, 'PART DU CA', Object.assign({ x: 3.75, y: yH, w: 1.0, h: 0.3 }, hd));
    txt(s, 'TAUX DE RACHAT (AOÛT 2020)', Object.assign({ x: 4.95, y: yH, w: 3.2, h: 0.3 }, hd));
    const scale = 2.3 / 21.2;
    seg.forEach((r, i) => {
      const y = y0 + i * rh, good = r[0] === 'Good';
      if (good) card(s, x0, y, 7.55, rh - 0.06, C.TINT);
      txt(s, r[0], { x: x0 + 0.15, y, w: 1.2, h: rh - 0.06, fontSize: 16, bold: true, valign: 'middle', color: good ? C.GREEN : C.INK, fontFace: FONT.HEAD });
      txt(s, [{ text: r[1], options: { bold: good } }, { text: '  (' + r[2] + ' %)', options: { color: C.MUTED } }], { x: 1.95, y, w: 1.8, h: rh - 0.06, fontSize: 14, valign: 'middle' });
      txt(s, r[3] + ' %', { x: 3.75, y, w: 1.0, h: rh - 0.06, fontSize: 14, valign: 'middle', bold: good });
      const bw = Math.max(r[4] * scale, 0.05);
      rect(s, 4.95, y + 0.1, bw, rh - 0.26, good ? C.ORANGE : C.LEAF);
      txt(s, String(r[4]).replace('.', ',') + ' %', { x: 4.95 + bw + 0.1, y, w: 0.9, h: rh - 0.06, fontSize: 14, bold: true, valign: 'middle', color: good ? C.ORANGE : C.INK });
    });
    txt(s, 'Seuils métier : récence ≤ 14 j / 15-60 j / 61-180 j ; Inactive = plus de 180 jours sans achat ; New = premier ticket il y a moins de 90 jours.', { x: x0, y: 5.68, w: 7.55, h: 0.45, fontSize: 11, color: C.MUTED });

    // Colonne droite : clustering
    const cx = 8.5, cw = 4.23;
    card(s, cx, 1.55, cw, 4.5);
    txt(s, 'Clustering K-Means, k = 6', { x: cx + 0.25, y: 1.7, w: cw - 0.5, h: 0.35, fontSize: 16, bold: true, color: C.GREEN, fontFace: FONT.HEAD });
    txt(s, '9 variables de comportement, ACP à 6 axes (83 % de variance) ; la CAH de Ward confirme la lecture.', { x: cx + 0.25, y: 2.1, w: cw - 0.5, h: 0.7, fontSize: 12.5, color: C.MUTED });
    stat(s, cx + 0.25, 2.85, cw - 0.5, '0,17', 'silhouette : basse et sans coude net, les classes découpent un continuum', C.GREEN, 32);
    stat(s, cx + 0.25, 4.3, cw - 0.5, '0,829', 'AUC du RFM croisé avec les classes, contre 0,818 pour la récence seule et 0,807 pour le RFM seul', C.GREEN, 32);
    takeaway(s, 'Le RFM suffit à cibler et se lit simplement ; le clustering sert de contrôle, pas de base de ciblage.');
    s.addNotes(
      "[8:30] Pour passer du score à une action, il faut un segment. Nous avons d'abord segmenté en RFM, avec des seuils métier : récence en trois classes à 14 et 60 jours, fréquence, montant, plus deux règles prioritaires, Inactive au-delà de 180 jours sans achat et New pour un premier ticket de moins de 90 jours. Cela donne sept segments. Top regroupe 28 % des clients, 68 % du chiffre d'affaires et rachète à 21,2 % ; Good pèse 15 % des clients, 17 % du chiffre d'affaires, avec un rachat de 6,5 %, contre 7,72 % pour l'ensemble de la base. " +
      "À côté, nous avons fait un K-Means à six classes sur neuf variables de comportement, après ACP. La silhouette est de 0,17, sans coude net : il découpe un continuum plutôt qu'il ne révèle des groupes naturels. Et il n'apporte presque rien : l'AUC du RFM croisé avec les classes est de 0,829, contre 0,818 pour la récence seule et 0,807 pour le RFM seul. Nous gardons donc le RFM, plus lisible, et nous utilisons le clustering comme contrôle. Voyons maintenant lequel de ces segments choisir."
    );
  }

  // =====================================================================================
  // SLIDE 11 : Pourquoi Good
  // =====================================================================================
  {
    const s = base('Le segment choisi', '« Good » est le seul candidat qui passe les sept critères : testable, joignable, pas déjà acquis', {
      source: 'Sources : results/05_candidate_segments.csv, 07_segments_candidats.csv, 07_key_numbers.json, 07_summary.md. Base complète : 200 530 clients (top 10 % = 20 053).',
    });
    const hl = { fill: { color: C.TINT }, bold: true, color: C.GREEN };
    const H = (t, extra) => ({ text: t, options: Object.assign({ bold: true, color: C.MUTED, fontSize: 12, align: 'center', valign: 'middle', border: [{ type: 'none' }, { type: 'none' }, { pt: 1.5, color: C.GREY }, { type: 'none' }] }, extra || {}) });
    const L = (t) => ({ text: t, options: { color: C.INK, fontSize: 13, align: 'left', valign: 'middle', border: [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: C.MINT }, { type: 'none' }] } });
    const V = (t, good, extra) => ({ text: t, options: Object.assign({ fontSize: 14, align: 'center', valign: 'middle', color: C.INK, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: C.MINT }, { type: 'none' }] }, good ? hl : {}, extra || {}) });
    const rows = [
      [H('', { align: 'left' }), H('Top'), H('Good', { fill: { color: C.TINT }, color: C.GREEN }), H('C3 Montants')],
      [L('Joignables par e-mail (enveloppe : 20 053)'), V('33 837 : trop'), V('17 486 : tient', true), V('21 756 : trop')],
      [L('Rachat en août 2020'), V('21,2 %'), V('6,5 %', true), V('9,8 %')],
      [L('Part des rachats'), V('76 %'), V('13 %', true), V('25 %')],
      [L('Mois actifs sur 12'), V('9,9'), V('8,1', true), V('6,3')],
      [L('Critères remplis (sur 7)'), V('5'), V('7', true), V('4')],
      [L('Verdict'), V('Écarté : déjà acquis', false, { fontSize: 12 }), V('Recommandé', true), V('Second choix', false, { fontSize: 12 })],
    ];
    s.addTable(rows, { x: 0.6, y: 1.55, w: 7.55, colW: [3.1, 1.5, 1.45, 1.5], rowH: [0.42, 0.56, 0.5, 0.5, 0.5, 0.5, 0.56], fontFace: FONT.BODY, margin: [0, 0.06, 0, 0.06] });
    txt(s, 'Critères fixés avant le classement : taille compatible avec un test A/B et « pas déjà acquis » sont éliminatoires. Les autres : poids des rachats, rachat ≥ 3 %, e-mail, valeur, réveil.', { x: 0.6, y: 5.25, w: 7.55, h: 0.7, fontSize: 11, color: C.MUTED });

    const cx = 8.55, cw = 4.18;
    txt(s, '96 %', { x: cx, y: 1.5, w: 1.7, h: 0.85, fontSize: 42, bold: true, color: C.ORANGE, fontFace: FONT.HEAD, valign: 'middle' });
    txt(s, 'du top 10 % par score est occupé par Top. Good n’y compte que 238 clients (1,5 %).', { x: cx + 1.75, y: 1.5, w: cw - 1.75, h: 0.85, fontSize: 13, valign: 'middle' });
    txt(s, 'Good n’est donc pas là où le score capte le plus : c’est un pari incrémental, à vérifier. Le score y trie pourtant bien (AUC intra-segment 0,68 ; 36 % des Good dans le top 30 %).', { x: cx, y: 2.45, w: cw, h: 1.0, fontSize: 12.5, color: C.MUTED });
    hiBar(s, { cats: ['A (20 % haut)', 'B (30 %)', 'C (50 % bas)'], vals: [13.4, 6.9, 3.6], colorOf: () => C.GREEN, x: cx, y: 3.45, w: cw, h: 2.6, title: 'Rachat dans Good selon le score (%)', fontSize: 11, max: 16, fmt: '0.0" %";;;' });
    takeaway(s, 'Le score classe les clients dans Good mais ne dit pas qui réagit : nous testons tout le segment.');
    s.addNotes(
      "[9:45] Nous avons évalué treize candidats, sept segments RFM et six classes, avec des critères fixés avant de regarder le classement. Deux sont éliminatoires : la taille, qui doit permettre un test A/B, et le fait de ne pas être déjà acquis. Top et les Réguliers sont écartés : ils rachètent à 21 %, ils reviendraient de toute façon. C3 Montants est le second choix, avec quatre critères sur sept. Good coche les sept : 30 307 clients sur la base complète, dont 17 486 joignables par e-mail, ce qui tient dans l'enveloppe de 20 053 clients, soit 10 % de la base. Ce sont des clients déjà actifs, 8,1 mois sur 12, mais qui rachètent à 6,5 %, donc pas saturés. " +
      "Nous devons être honnêtes : Top occupe 96 % du top 10 % par score ; Good n'y a que 238 clients. Good n'est pas le segment où le score capte le plus de rachats, c'est un pari incrémental. Dans Good, le score trie quand même : 13,4 % de rachat dans les 20 % du haut, 3,6 % dans la moitié basse. Mais propension n'est pas effet causal : le score ne dit pas qui réagit à une campagne, d'où un test sur tout le segment."
    );
  }

  // =====================================================================================
  // SLIDE 12 : Plan d'action sur Good
  // =====================================================================================
  {
    const s = base('Plan d’action', 'Un rappel par e-mail « votre prochain panier du week-end », envoyé avant que Good ne glisse vers Decel', {
      source: 'Sources : results/07_good_persona.csv (médianes), 07_summary.md (message, canal, calendrier), 05_segment_profiles.csv. Message et calendrier : à tester.',
    });
    // Persona
    txt(s, 'QUI : LE CLIENT « GOOD »', { x: 0.6, y: 1.6, w: 4.3, h: 0.3, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 1 });
    const ps = [['17', 'tickets sur 12 mois'], ['8,1', 'mois actifs sur 12'], ['18 j', 'entre deux achats'], ['29 j', 'depuis le dernier achat'], ['43 €', 'panier médian'], ['58 %', 'joignables par e-mail']];
    ps.forEach((p, i) => {
      const x = 0.6 + (i % 2) * 2.2, y = 2.0 + Math.floor(i / 2) * 0.88;
      txt(s, p[0], { x, y, w: 2.0, h: 0.5, fontSize: 24, bold: true, color: C.GREEN, fontFace: FONT.HEAD, valign: 'bottom' });
      txt(s, p[1], { x, y: y + 0.5, w: 2.0, h: 0.3, fontSize: 12, color: C.MUTED });
    });
    // Leviers : racheteurs vs non-racheteurs
    const lx = 5.5;
    txt(s, 'CE QUI DISTINGUE CEUX QUI RACHÈTENT EN AOÛT', { x: lx, y: 1.6, w: 5.0, h: 0.3, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 1 });
    rect(s, 10.35, 1.67, 0.16, 0.16, C.GREEN); txt(s, 'racheteurs', { x: 10.58, y: 1.6, w: 0.95, h: 0.3, fontSize: 11, color: C.MUTED, valign: 'middle' });
    rect(s, 11.6, 1.67, 0.16, 0.16, C.GREY); txt(s, 'non-racheteurs', { x: 11.83, y: 1.6, w: 1.0, h: 0.3, fontSize: 11, color: C.MUTED, valign: 'middle' });
    const lev = [
      ['Régularité', 'mois actifs sur 12', 9.0, 8.1, '9,0', '8,1'],
      ['Rythme d’achat', 'jours entre deux achats (plus court = mieux)', 13.6, 17.9, '13,6 j', '17,9 j'],
      ['Week-end', 'part des tickets le week-end', 32.0, 25.9, '32 %', '26 %'],
    ];
    lev.forEach((r, i) => {
      const y = 2.05 + i * 0.88, maxv = Math.max(r[2], r[3]), sc = 3.3 / maxv;
      txt(s, r[0], { x: lx, y, w: 2.3, h: 0.3, fontSize: 14, bold: true });
      txt(s, r[1], { x: lx, y: y + 0.3, w: 2.3, h: 0.5, fontSize: 10.5, color: C.MUTED });
      rect(s, 7.95, y + 0.05, r[2] * sc, 0.3, C.GREEN);
      txt(s, r[4], { x: 7.95 + r[2] * sc + 0.08, y: y + 0.05, w: 0.9, h: 0.3, fontSize: 13, bold: true, valign: 'middle' });
      rect(s, 7.95, y + 0.42, r[3] * sc, 0.3, C.GREY);
      txt(s, r[5], { x: 7.95 + r[3] * sc + 0.08, y: y + 0.42, w: 0.9, h: 0.3, fontSize: 13, valign: 'middle', color: C.MUTED });
    });
    // Message / canal / calendrier
    const cw = 3.88, gap = 0.245, cy = 4.8, ch = 2.08;
    const cards = [
      ['MESSAGE', ['« Votre prochain panier du week-end »', 'Rappel court, déclenché au rythme du client', 'Deux variantes : avec remise 10 % et sans remise']],
      ['CANAL : E-MAIL', ['17 486 clients Good joignables (58 %)', 'Coût de contact supposé 0,02 €', 'Les 45 % de la base sans e-mail restent hors campagne']],
      ['CALENDRIER', ['Envoi jeudi ou vendredi matin : Good achète surtout vendredi-samedi', 'Relance avant 60 jours sans achat, seuil de bascule vers Decel', 'Suivi de J − 14 à J + 60']],
    ];
    cards.forEach((c, i) => {
      const x = M + i * (cw + gap);
      card(s, x, cy, cw, ch);
      txt(s, c[0], { x: x + 0.22, y: cy + 0.15, w: cw - 0.4, h: 0.28, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 1 });
      bullets(s, c[1], x + 0.22, cy + 0.5, cw - 0.45, ch - 0.6, 12.5);
    });
    s.addNotes(
      "[11:00] Voici le plan d'action sur Good. Le client type est régulier : 17 tickets sur 12 mois, actif 8,1 mois sur 12, un achat tous les 18 jours environ, un panier médian de 43 euros, et 58 % sont joignables par e-mail. " +
      "Trois leviers ressortent en comparant ceux qui rachètent en août à ceux qui ne rachètent pas : la régularité, avec 9,0 mois actifs contre 8,1 ; un rythme d'achat plus court, 13,6 jours entre deux achats contre 17,9 ; et le week-end, 32 % des tickets contre 26 %. Attention, c'est un effet de calendrier possible : août 2020 commence un samedi. " +
      "D'où le message, « votre prochain panier du week-end », en e-mail, le canal que nous pouvons mesurer et dont le coût est faible, envoyé le jeudi ou le vendredi matin, puisque Good achète surtout le vendredi et le samedi. L'envoi se déclenche au rythme du client, avec une relance avant 60 jours sans achat, avant le basculement vers Decel. Nous prévoyons une variante avec remise de 10 % et une variante sans remise. Reste à savoir combien cela peut rapporter."
    );
  }

  // =====================================================================================
  // SLIDE 13 : Scénarios économiques, seuils de rentabilité, test A/B
  // =====================================================================================
  {
    const s = base('Rentabilité et mesure', 'À 10 % de remise, rien n’est rentable au scénario central ; un rappel sans remise le serait dès 0,14 point', {
      source: 'Sources : results/07_scenarios_economiques.csv, 07_hypotheses.json, 07_ab_mde.csv, 07_ab_dimensionnement.csv, 07_key_numbers.json. Euros : hypothèses.',
    });
    // Hypothèses
    tag(s, 0.6, 1.62);
    txt(s, 'Contact 0,02 € · marge 25 % · remise 10 % utilisée par 30 % des clients · uplift de +0,5 / +1 / +2 points de rachat', { x: 2.0, y: 1.58, w: 5.2, h: 0.4, fontSize: 11.5, color: C.MUTED, valign: 'middle' });
    // Table scénarios
    const H = (t, o) => ({ text: t, options: Object.assign({ bold: true, color: C.MUTED, fontSize: 11, align: 'center', valign: 'middle', border: [{ type: 'none' }, { type: 'none' }, { pt: 1.2, color: C.GREY }, { type: 'none' }] }, o || {}) });
    const bd = [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: C.MINT }, { type: 'none' }];
    const L = (t, good) => ({ text: t, options: { fontSize: 12.5, valign: 'middle', align: 'left', color: good ? C.GREEN : C.INK, bold: !!good, border: bd } });
    const N = (v, good) => ({ text: (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ','), options: { fontSize: 13, valign: 'middle', align: 'center', bold: v > 0 || !!good, color: v > 0 ? C.GREEN : C.INK, border: bd } });
    const rows = [
      [H('Marge nette (k€), remise 10 %', { align: 'left' }), H('+0,5 pt'), H('+1 pt (central)', { color: C.INK }), H('+2 pt')],
      [L('Good : tous les e-mailables', true), N(-1.3, true), N(-0.2, true), N(1.9, true)],
      [L('10 % au hasard'), N(-2.1), N(-0.9), N(1.5)],
      [L('Top 10 % par score'), N(-9.7), N(-8.5), N(-6.1)],
    ];
    s.addTable(rows, { x: 0.6, y: 2.15, w: 6.6, colW: [2.9, 1.0, 1.7, 1.0], rowH: [0.36, 0.38, 0.38, 0.38], fontFace: FONT.BODY, margin: [0, 0.06, 0, 0.06] });
    // Seuils de rentabilité (Good, tous e-mailables), barres dessinées en formes
    txt(s, 'Uplift minimal pour être rentable (Good, hypothèses)', { x: 0.6, y: 4.05, w: 6.6, h: 0.3, fontSize: 12.5, bold: true });
    const sx = 2.5, sc = 3.6 / 1.11;
    [['Rappel sans remise', 0.14, '0,14 pt', C.ORANGE], ['Remise de 5 %', 0.60, '0,60 pt', C.GREEN], ['Remise de 10 %', 1.11, '1,11 pt', C.GREEN]].forEach((r, i) => {
      const y = 4.75 + i * 0.42;
      txt(s, r[0], { x: 0.6, y, w: 1.85, h: 0.32, fontSize: 12.5, valign: 'middle' });
      rect(s, sx, y, r[1] * sc, 0.32, r[3]);
      txt(s, r[2], { x: sx + r[1] * sc + 0.1, y, w: 0.9, h: 0.32, fontSize: 13, bold: true, valign: 'middle', color: r[3] === C.ORANGE ? C.ORANGE : C.INK });
    });
    s.addShape(SH.LINE, { x: sx + sc, y: 4.68, w: 0, h: 1.4, line: { color: C.SLATE, width: 1.25, dashType: 'dash' } });
    txt(s, 'scénario central : +1 pt', { x: sx + sc - 0.4, y: 4.4, w: 2.3, h: 0.25, fontSize: 10.5, color: C.SLATE });

    // A/B
    const cx = 7.6, cw = 5.13;
    card(s, cx, 1.62, cw, 4.43);
    txt(s, 'Test A/B sur tout Good', { x: cx + 0.28, y: 1.77, w: cw - 0.5, h: 0.35, fontSize: 16, bold: true, color: C.GREEN, fontFace: FONT.HEAD });
    stat(s, cx + 0.28, 2.2, 2.3, '1,22 pt', 'effet minimal détectable (18 % en relatif)', C.GREEN, 30);
    stat(s, cx + 2.75, 2.2, 2.2, '70 / 30', 'traités / témoins', C.GREEN, 30);
    bullets(s, [
      '17 486 e-mailables randomisés, α = 5 %, puissance 80 %',
      '25 777 clients seraient nécessaires pour détecter 1 pt : plus que Good n’en compte',
      '4 semaines de test, puis suivi à 60 jours',
      'Décision : uplift ≥ seuil de rentabilité (1,11 pt avec remise 10 %), sans simple avance d’achats',
    ], cx + 0.28, 3.7, cw - 0.55, 2.25, 12.5);
    takeaway(s, 'La remise de 10 % est un pari (seuil 1,11 pt) ; un rappel sans remise est rentable dès 0,14 pt : à inclure dans le test.');
    s.addNotes(
      "[12:30] Combien cela peut rapporter ? Attention : tous les euros de cette slide reposent sur des hypothèses, ce ne sont pas des prévisions. Nous supposons 0,02 euro par contact, 25 % de marge, une remise de 10 % utilisée par 30 % des clients, et un effet de la campagne de +0,5, +1 ou +2 points de rachat. " +
      "Résultat : avec une remise de 10 %, au scénario central, à +1 point, aucune stratégie n'est rentable. Tout Good perd 0,2 millier d'euros, le top 10 % par score perd 8,5 milliers : cibler les plus probables revient à offrir la remise à des gens qui auraient acheté de toute façon. Ce n'est pas la même chose de cibler les plus probables et les plus influençables. Tout Good devient rentable à +2 points, avec 1,9 millier d'euros. " +
      "Le seuil de rentabilité de tout Good est de 1,11 point avec la remise de 10 %, 0,60 avec 5 %, et seulement 0,14 point pour un rappel sans remise. Pour le mesurer, un test A/B sur les 17 486 e-mailables de Good, 70 % traités, 30 % témoins : l'effet minimal détectable est de 1,22 point, juste au-dessus du seuil de 1,11. Quatre semaines de test, puis un suivi à 60 jours."
    );
  }

  // =====================================================================================
  // SLIDE 14 : Conclusion (fond sombre)
  // =====================================================================================
  {
    const s = dark();
    const CARD = '17503A';
    txt(s, 'CONCLUSION', { x: M, y: 0.4, w: 9, h: 0.3, fontSize: 11, bold: true, color: C.LEAF, charSpacing: 2 });
    txt(s, 'Prédire le rachat est possible ; en tirer de la valeur se prouve', { x: M, y: 0.75, w: W - 2 * M, h: 0.95, fontFace: FONT.HEAD, fontSize: 28, bold: true, color: C.WHITE });
    const msgs = [
      ['1', 'La récence fait l’essentiel, le modèle le reste', 'LightGBM : AUC 0,879 en validation croisée, contre 0,818 pour la récence seule. Le top 10 % capte 53 % des racheteurs (précision 40,6 %).'],
      ['2', 'Good : un pari incrémental, joignable en e-mail', '17 486 clients joignables, tenant dans les 10 % ; rachat 6,5 %. Le score les trie (13,4 % à 3,6 %) mais ne dit pas qui réagit.'],
      ['3', 'La rentabilité se prouve, elle ne se déduit pas', 'Remise de 10 % non rentable au scénario central (seuil 1,11 pt) ; rappel sans remise rentable dès 0,14 pt ; test détectant 1,22 pt.'],
    ];
    const cw = 3.88, gap = 0.245, cy = 1.95, ch = 2.55;
    msgs.forEach((m, i) => {
      const x = M + i * (cw + gap);
      card(s, x, cy, cw, ch, CARD);
      txt(s, m[0], { x: x + 0.25, y: cy + 0.15, w: 0.6, h: 0.6, fontSize: 30, bold: true, color: C.LEAF, fontFace: FONT.HEAD });
      txt(s, m[1], { x: x + 0.25, y: cy + 0.78, w: cw - 0.5, h: 0.6, fontSize: 15.5, bold: true, color: C.WHITE });
      txt(s, m[2], { x: x + 0.25, y: cy + 1.4, w: cw - 0.5, h: 1.1, fontSize: 12.5, color: C.MINT });
    });
    // Prochaines étapes
    txt(s, 'PROCHAINES ÉTAPES', { x: M, y: 4.8, w: 5, h: 0.3, fontSize: 11, bold: true, color: C.LEAF, charSpacing: 2 });
    const steps = [
      'Lancer le test A/B sur Good (70 / 30, 4 semaines, suivi à 60 jours)',
      'Multiplier les coupures pour mesurer l’effet calendrier (août 2020 commence un samedi)',
      'Passer à un modèle d’uplift après le premier test, puis ré-entraîner',
    ];
    bullets(s, steps, M, 5.2, 7.7, 1.6, 14, C.WHITE);
    // Encart score Kaggle
    s.addShape(SH.ROUNDED_RECTANGLE, { x: 8.75, y: 4.85, w: 3.98, h: 1.9, fill: { color: C.DEEP }, line: { color: C.ORANGE, width: 1.75, dashType: 'dash' }, rectRadius: 0.1 });
    txt(s, 'SCORE KAGGLE', { x: 8.75, y: 5.05, w: 3.98, h: 0.3, fontSize: 11, bold: true, color: C.ORANGE, align: 'center', charSpacing: 2 });
    txt(s, '[score Kaggle à insérer]', { x: 8.75, y: 5.45, w: 3.98, h: 0.9, fontSize: 22, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FONT.HEAD });
    s.addNotes(
      "[14:00] Pour conclure, trois messages. Un : la récence fait l'essentiel, la performance du modèle est de 0,879 en AUC en validation croisée contre 0,818 pour la récence seule, et avec 10 % de la base, le top 10 % capte 53 % des racheteurs, avec 40,6 % de précision. Deux : notre recommandation porte sur le segment Good, 17 486 clients joignables par e-mail, qui rachètent à 6,5 % : un pari incrémental, qui tient dans l'enveloppe de 10 %. Trois : la rentabilité ne se déduit pas d'un score, elle se prouve. La remise de 10 % n'est pas rentable au scénario central, le seuil est de 1,11 point, un rappel sans remise est rentable dès 0,14 point, et le test A/B détecte 1,22 point. " +
      "Nos limites : un seul mois cible, un effet de calendrier possible, et une propension qui n'est pas un effet causal. Prochaines étapes : lancer le test, multiplier les coupures, puis passer à un modèle d'uplift. Notre score sur le leaderboard Kaggle est de [score Kaggle à insérer]. Merci, nous sommes prêts pour vos questions."
    );
  }
};
