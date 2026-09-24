const pptxgen = require('pptxgenjs');
const path = require('path');

const OUT = process.argv[2] || 'Feminiz_RFM_Decel.pptx';
const FIG = process.argv[3] || '.';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.title = 'Feminiz - Segmentation RFM et plan de réactivation des Decel';

// Palette
const PLUM = '2B1B26', BERRY = '7A2E4F', CORAL = 'E4572E', SLATE = '3F5F7F', SLATE2 = '8FA7BF';
const GREY = 'B9B3AE', INK = '1E1A1D', MUTED = '6E6468', TINT = 'F7F1F3', WHITE = 'FFFFFF', ROSE = 'E9D5DC';
const HEAD = 'Cambria', BODY = 'Calibri';
const W = 13.333, M = 0.6;

let slideNo = 0;
const NB = '\u00A0';
function fr(t) {
  if (typeof t !== 'string') return t;
  return t.replace(/(\d) (?=\d{3}\b)/g, '$1' + NB).replace(/ (%|€|:|\?|!|;|»)/g, NB + '$1').replace(/« /g, '«' + NB).replace(/(\d) (j|pts|ans)\b/g, '$1' + NB + '$2');
}
function frRuns(t) { return Array.isArray(t) ? t.map(r => (typeof r === 'object' && r.text !== undefined ? Object.assign({}, r, { text: fr(r.text) }) : r)) : fr(t); }
const _addSlide = pres.addSlide.bind(pres);
pres.addSlide = function (...a) {
  const sl = _addSlide(...a);
  const at = sl.addText.bind(sl), tb = sl.addTable.bind(sl);
  sl.addText = (t, o) => at(frRuns(t), o);
  sl.addTable = (rows, o) => tb(rows.map(r => r.map(c => (typeof c === 'object' ? Object.assign({}, c, { text: fr(c.text) }) : fr(c)))), o);
  return sl;
};
function base(kicker, title, opts = {}) {
  const s = pres.addSlide();
  slideNo += 1;
  s.background = { color: WHITE };
  if (kicker) s.addText(kicker.toUpperCase(), { x: M, y: 0.32, w: 9, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: BERRY, charSpacing: 2, margin: 0, isTextBox: true });
  if (title) s.addText(title, { x: M, y: 0.62, w: W - 2 * M, h: 0.75, fontFace: HEAD, fontSize: opts.titleSize || 26, bold: true, color: INK, margin: 0, valign: 'top', isTextBox: true });
  if (opts.source) s.addText(opts.source, { x: M, y: 7.02, w: 10.5, h: 0.28, fontFace: BODY, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
  s.addText(String(slideNo), { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.28, fontFace: BODY, fontSize: 9, color: MUTED, align: 'right', margin: 0, isTextBox: true });
  return s;
}
const SRC = 'Source : tickets de caisse Feminiz, 12 derniers mois complets (01/09/2015 – 31/08/2016), 12 340 clientes actives';

function card(s, x, y, w, h, fill = TINT) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
}
function chip(s, x, y, label, fill = BERRY, color = WHITE, w = 0.5) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.42, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
  s.addText(label, { x, y, w, h: 0.42, fontFace: BODY, fontSize: 13, bold: true, color, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
}
function stat(s, x, y, w, value, label, color = BERRY, vsize = 34) {
  s.addText(value, { x, y, w, h: 0.7, fontFace: HEAD, fontSize: vsize, bold: true, color, margin: 0, valign: 'bottom', isTextBox: true });
  s.addText(label, { x, y: y + 0.72, w, h: 0.6, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, valign: 'top', isTextBox: true });
}
function bullets(s, items, x, y, w, h, size = 14, color = INK) {
  const arr = items.map((t, i) => {
    const runs = Array.isArray(t) ? t : [{ text: t }];
    return runs.map((r, j) => ({ text: r.text, options: Object.assign({ bold: !!r.bold, color: r.color || color },
      j === 0 ? { bullet: { indent: 14 }, paraSpaceAfter: 6 } : {}, (j === runs.length - 1 && i < items.length - 1) ? { breakLine: true } : {}) }));
  }).flat();
  s.addText(arr, { x, y, w, h, fontFace: BODY, fontSize: size, color, valign: 'top', margin: 0, isTextBox: true });
}
function pctFmt() { return '0" %";;;'; }

// Bar chart with highlighted categories: one stacked series per color, zeros hidden
function hiBar(s, { cats, vals, colorOf, x, y, w, h, dir = 'col', fmt = pctFmt(), max, title, fontSize = 11 }) {
  const colors = [...new Set(cats.map((c, i) => colorOf(c, i)))];
  const data = colors.map(col => ({ name: col, labels: cats, values: vals.map((v, i) => (colorOf(cats[i], i) === col ? v : 0)) }));
  const o = {
    x, y, w, h, barDir: dir === 'col' ? 'col' : 'bar', barGrouping: 'stacked', chartColors: colors, barGapWidthPct: 60,
    showValue: true, dataLabelPosition: 'inEnd', dataLabelFormatCode: fmt, dataLabelFontSize: fontSize, dataLabelColor: WHITE, dataLabelFontBold: true,
    catAxisLabelColor: MUTED, catAxisLabelFontSize: fontSize, catAxisLabelFontFace: BODY, valAxisHidden: true, valGridLine: { style: 'none' },
    catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false, valAxisLineShow: false,
  };
  if (dir !== 'col') o.catAxisOrientation = 'maxMin';
  if (max !== undefined) { o.valAxisMaxVal = max; o.valAxisMinVal = 0; }
  if (title) { o.showTitle = true; o.title = title; o.titleFontSize = 12; o.titleColor = INK; o.titleFontFace = BODY; }
  s.addChart(pres.charts.BAR, data, o);
}

// ---------------------------------------------------------------- 1. Titre
{
  const s = pres.addSlide(); slideNo += 1;
  s.background = { color: PLUM };
  s.addText('MARKETING ECONOMETRICS · PROJET 1', { x: M, y: 1.2, w: 10, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: 'D9A7B8', charSpacing: 3, margin: 0, isTextBox: true });
  s.addText('Réveiller les « Decel »', { x: M, y: 1.75, w: 11.5, h: 1.1, fontFace: HEAD, fontSize: 50, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText('Segmentation RFM de la clientèle Feminiz et plan de réactivation des clientes qui ralentissent', { x: M, y: 2.95, w: 10.5, h: 0.9, fontFace: BODY, fontSize: 20, color: 'EBDDE3', margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.35, w: 5.4, h: 1.25, fill: { color: '3B2835' }, line: { color: '3B2835' }, rectRadius: 0.08 });
  s.addText([
    { text: 'Comité de pilotage marketing', options: { bold: true, color: WHITE, breakLine: true } },
    { text: 'Données : septembre 2015 – août 2016', options: { color: 'D9C3CC', breakLine: true } },
    { text: 'Groupe : [Noms du groupe]', options: { color: 'D9C3CC' } },
  ], { x: M + 0.3, y: 4.45, w: 5, h: 1.05, fontFace: BODY, fontSize: 15, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('TSE · M2 EA/ES · 2025-2026', { x: M, y: 6.75, w: 6, h: 0.3, fontFace: BODY, fontSize: 11, color: 'B89AA8', margin: 0, isTextBox: true });
  s.addNotes("[0:15] Bonjour. Nous avons été mandatés par la direction marketing de Feminiz pour segmenter sa clientèle selon la méthode RFM et proposer des leviers d'action sur un segment prioritaire. Nous avons choisi les « Decel », des clientes de valeur qui ralentissent.");
}

// ---------------------------------------------------------------- 2. Contexte
{
  const s = base('01 · Contexte et objectifs', 'Gamme élargie, carte de fidélité : place au ciblage');
  card(s, M, 1.65, 5.6, 3.55);
  s.addText('La situation', { x: M + 0.35, y: 1.85, w: 5, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: BERRY, margin: 0, isTextBox: true });
  bullets(s, [
    [{ text: 'Forte concurrence ', bold: true }, { text: 'sur le marché de la lingerie.' }],
    [{ text: 'Extension de gamme : ', bold: true }, { text: 'maillots de bain et homewear, en complément de la corseterie.' }],
    [{ text: 'Programme de fidélité : ', bold: true }, { text: 'une carte qui identifie chaque cliente et ses achats.' }],
    [{ text: 'Besoin : ', bold: true }, { text: 'adapter la communication à chaque profil et mieux répartir le budget marketing.' }],
  ], M + 0.35, 2.4, 5.0, 2.7, 15);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.45, w: 5.6, h: 1.35, fill: { color: PLUM }, line: { color: PLUM }, rectRadius: 0.08 });
  s.addText([
    { text: 'La question du jour', options: { bold: true, color: 'F2B8A6', breakLine: true } },
    { text: 'Sur quelles clientes concentrer le prochain euro de marketing relationnel ?', options: { color: WHITE } },
  ], { x: M + 0.35, y: 5.5, w: 5.0, h: 1.25, fontFace: BODY, fontSize: 15, margin: 0, valign: 'middle', isTextBox: true });
  const objs = [
    ['1', 'Segmenter', 'Construire une segmentation RFM (Récence, Fréquence, Montant) sur les 12 derniers mois.'],
    ['2', 'Choisir', 'Identifier un segment prioritaire et comprendre ce qui le distingue du reste de la base.'],
    ['3', 'Agir', 'Proposer des actions concrètes, chiffrées et mesurables pour ce segment.'],
  ];
  objs.forEach(([n, t, d], i) => {
    const y = 1.65 + i * 1.7;
    chip(s, 6.75, y + 0.1, n, BERRY);
    s.addText(t, { x: 7.45, y: y, w: 5.2, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(d, { x: 7.45, y: y + 0.5, w: 5.2, h: 0.9, fontFace: BODY, fontSize: 15, color: MUTED, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes("[0:45] Contexte : Feminiz est sous pression concurrentielle. Elle a déjà agi sur l'offre, en ajoutant le bain et le homewear, et sur la relation, avec une carte de fidélité. La carte nous donne des données individuelles : l'étape suivante est de s'en servir pour cibler. Nos objectifs : segmenter, choisir un segment prioritaire, et proposer des actions mesurables.");
}

// ---------------------------------------------------------------- 3. Données
{
  const s = base('02 · Les données', "4 ans d'historique de tickets, une période d'étude de 12 mois", { source: 'Données : tables RECEIPTS, CUSTOMER, CUSTOMER_ADDITIONAL, PRODUCTS, REFERENTIAL, STORE' });
  const tiles = [
    ['332 736', 'lignes de tickets\n(sept. 2012 → août 2016)'],
    ['36 157', 'porteuses de la carte\nde fidélité'],
    ['113', 'boutiques (Paris et\nprovince, centre-ville et galeries)'],
    ['3 lignes', 'corseterie, homewear, bain\n(206 modèles)'],
  ];
  tiles.forEach(([v, l], i) => {
    const x = M + i * 3.07;
    card(s, x, 1.6, 2.85, 1.5);
    stat(s, x + 0.25, 1.65, 2.5, v, l, BERRY, 30);
  });
  // Frise chronologique
  const x0 = M + 0.2, x1 = W - M - 0.2, y = 4.45;
  const yr = (d) => x0 + (x1 - x0) * (d - 2012.667) / (2016.667 - 2012.667);
  s.addShape(pres.shapes.LINE, { x: x0, y, w: x1 - x0, h: 0, line: { color: GREY, width: 2 } });
  [2013, 2014, 2015, 2016].forEach(yv => {
    s.addShape(pres.shapes.LINE, { x: yr(yv), y: y - 0.08, w: 0, h: 0.16, line: { color: GREY, width: 1.5 } });
    s.addText(String(yv), { x: yr(yv) - 0.4, y: y + 0.12, w: 0.8, h: 0.3, fontFace: BODY, fontSize: 11, color: MUTED, align: 'center', margin: 0, isTextBox: true });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: yr(2014.667), y: y - 0.62, w: yr(2015.667) - yr(2014.667), h: 0.42, fill: { color: SLATE2 }, line: { color: SLATE2 }, rectRadius: 0.06 });
  s.addText('N-1 : migration', { x: yr(2014.667), y: y - 0.62, w: yr(2015.667) - yr(2014.667), h: 0.42, fontFace: BODY, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: yr(2015.667), y: y - 0.62, w: yr(2016.667) - yr(2015.667), h: 0.42, fill: { color: BERRY }, line: { color: BERRY }, rectRadius: 0.06 });
  s.addText('Période d\'étude RFM', { x: yr(2015.667), y: y - 0.62, w: yr(2016.667) - yr(2015.667), h: 0.42, fontFace: BODY, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  s.addText('Historique utilisé pour comprendre le comportement passé', { x: x0, y: y - 0.62, w: yr(2014.667) - x0 - 0.1, h: 0.42, fontFace: BODY, fontSize: 12, color: MUTED, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  bullets(s, [
    [{ text: 'Périmètre : ', bold: true }, { text: '01/09/2015 – 31/08/2016 → 119 215 lignes, 30 921 visites, 12 444 clientes ayant acheté ; 104 à CA nul exclues → 12 340 clientes actives.' }],
    [{ text: 'Une visite = ', bold: true }, { text: 'cliente × boutique × date × n° de ticket.' }],
    [{ text: 'Nettoyage : ', bold: true }, { text: 'remises recalculées, cadeaux identifiés (articles à 0 €), âge borné à 15-90 ans, variable de résidence (ETAT) écartée car incohérente avec les boutiques.' }],
  ], M, 5.2, W - 2 * M, 1.7, 13);
  s.addNotes("[0:45] Nous disposons de 4 ans de tickets, de 36 000 porteuses de carte et de 113 boutiques. La segmentation porte sur les 12 derniers mois complets ; l'année précédente sert à l'analyse de migration, et l'historique complet à comprendre le comportement passé. Une visite, c'est une cliente, dans une boutique, à une date, avec un numéro de ticket.");
}

// ---------------------------------------------------------------- 4. Chiffres clés
{
  const s = base('03 · La base clientes', 'Près d\'une cliente sur deux ne vient qu\'une fois par an', { source: SRC + ' · Mix : part du CA des produits rattachés à une ligne' });
  const st = [['3,27 M€', "chiffre d'affaires\nsur 12 mois"], ['265 €', 'CA moyen par cliente\n(médiane 196 €)'], ['106 €', 'panier moyen par visite\n(3,9 articles)'], ['45 %', "des clientes ne viennent\nqu'une fois dans l'année"]];
  st.forEach(([v, l], i) => { card(s, M + i * 3.07, 1.6, 2.85, 1.55); stat(s, M + i * 3.07 + 0.25, 1.6, 2.5, v, l, BERRY, 30); });
  s.addChart(pres.charts.BAR, [{ name: 'CA (k€)', labels: ['sept', 'oct', 'nov', 'déc', 'janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août'], values: [246, 256, 227, 305, 263, 205, 263, 340, 331, 374, 266, 200] }], {
    x: M, y: 3.45, w: 7.4, h: 3.45, barDir: 'col', chartColors: [BERRY], barGapWidthPct: 45,
    showTitle: true, title: "CA mensuel (k€), sept. 2015 → août 2016 : pic d'avril à juin", titleFontSize: 13, titleColor: INK, titleFontFace: BODY,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10, dataLabelColor: MUTED, dataLabelFormatCode: '0',
    catAxisLabelColor: MUTED, catAxisLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false,
  });
  s.addChart(pres.charts.DOUGHNUT, [{ name: 'Mix', labels: ['Corseterie', 'Homewear', 'Bain'], values: [70.1, 16.7, 13.2] }], {
    x: 8.35, y: 3.45, w: 2.6, h: 3.1, chartColors: [BERRY, 'C98AA3', SLATE2], holeSize: 55,
    showTitle: true, title: 'Mix du CA', titleFontSize: 13, titleColor: INK, titleFontFace: BODY,
    showValue: false, showPercent: true, dataLabelColor: WHITE, dataLabelFontSize: 10, showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: MUTED,
  });
  bullets(s, [
    [{ text: '99 % ', bold: true }, { text: 'de femmes, 45 ans en moyenne' }],
    [{ text: '39 % ', bold: true }, { text: 'du CA à Paris' }],
    [{ text: '76 % ', bold: true }, { text: 'des achats en centre-ville' }],
    [{ text: '18 % ', bold: true }, { text: 'des lignes de ticket sont des cadeaux (programme de fidélité)' }],
  ], 11.05, 3.65, 1.75, 3.2, 11);
  s.addNotes("[1:00] Quelques repères : 3,3 millions d'euros de CA sur l'année, 265 € par cliente, un panier de 106 € pour près de 4 articles. Près d'une cliente sur deux ne vient qu'une fois par an. L'activité culmine d'avril à juin, portée par le bain. La corseterie reste le cœur du CA (70 %). Les cadeaux sont omniprésents : c'est le mécanisme du programme de fidélité.");
}

// ---------------------------------------------------------------- 5. Méthode RFM
{
  const s = base('04 · Méthode', 'Une segmentation RFM en deux étapes, fidèle à la méthode du cours', { source: 'Seuils proches des tertiles (quantiles 33 % / 67 % : 144 € / 273 € ; 1 / 2 visites ; 62 / 154 jours) · New = carte de moins d\'un an' });
  // Seuils
  const rows = [['', 'Bas', 'Moyen', 'Haut'], ['Récence', '> 150 j', '61-150 j', '≤ 60 j'], ['Fréquence', '1 visite', '2 visites', '3 et +'], ['Montant', '< 140 €', '140-280 €', '> 280 €']];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: {
    bold: i === 0 || j === 0, color: i === 0 ? WHITE : INK, fill: { color: i === 0 ? BERRY : (j === 0 ? TINT : WHITE) }, fontFace: BODY, fontSize: 13, align: j === 0 ? 'left' : 'center', valign: 'middle',
  } }))), { x: M, y: 1.75, w: 4.4, colW: [1.3, 1.0, 1.05, 1.05], rowH: 0.45, border: { type: 'solid', color: 'E3D8DC', pt: 0.75 } });
  s.addText('① Niveaux par critère', { x: M, y: 1.4, w: 4.4, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: BERRY, margin: 0, isTextBox: true });
  // Grille FM
  s.addText('② Fréquence × Montant → FM', { x: M, y: 3.85, w: 4.4, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: BERRY, margin: 0, isTextBox: true });
  const fm = [['Bas', 'Bas', 'Moy.'], ['Bas', 'Moy.', 'Haut'], ['Moy.', 'Haut', 'Haut']];
  const fmCol = { 'Bas': 'EDE5E8', 'Moy.': 'C98AA3', 'Haut': BERRY };
  const gx = M + 0.95, gy = 4.55, cw = 1.12, ch = 0.55;
  ['M bas', 'M moyen', 'M haut'].forEach((t, j) => s.addText(t, { x: gx + j * cw, y: gy - 0.33, w: cw, h: 0.3, fontFace: BODY, fontSize: 11, color: MUTED, align: 'center', margin: 0, isTextBox: true }));
  ['F basse', 'F moyenne', 'F haute'].forEach((t, i) => s.addText(t, { x: M, y: gy + i * ch, w: 0.9, h: ch, fontFace: BODY, fontSize: 11, color: MUTED, valign: 'middle', margin: 0, isTextBox: true }));
  fm.forEach((r, i) => r.forEach((c, j) => {
    s.addShape(pres.shapes.RECTANGLE, { x: gx + j * cw, y: gy + i * ch, w: cw - 0.05, h: ch - 0.05, fill: { color: fmCol[c] }, line: { color: WHITE } });
    s.addText('FM ' + c.toLowerCase(), { x: gx + j * cw, y: gy + i * ch, w: cw - 0.05, h: ch - 0.05, fontFace: BODY, fontSize: 11, bold: true, color: c === 'Bas' ? INK : WHITE, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  }));
  // Consolidation RFM
  s.addText('③ FM × Récence → 5 segments (+ New)', { x: 5.6, y: 1.4, w: 7, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: BERRY, margin: 0, isTextBox: true });
  const rx = 7.0, ry = 2.2, rw = 1.85, rh = 1.05;
  ['FM bas', 'FM moyen', 'FM haut'].forEach((t, j) => s.addText(t, { x: rx + j * rw, y: ry - 0.38, w: rw, h: 0.33, fontFace: BODY, fontSize: 12, bold: true, color: MUTED, align: 'center', margin: 0, isTextBox: true }));
  ['Récence haute\n(≤ 60 j)', 'Récence moyenne\n(61-150 j)', 'Récence basse\n(> 150 j)'].forEach((t, i) => s.addText(t, { x: 5.6, y: ry + i * rh, w: 1.35, h: rh, fontFace: BODY, fontSize: 11, color: MUTED, valign: 'middle', margin: 0, isTextBox: true }));
  const segCells = [
    [['Small', 'D8D2CD', INK], ['Top', SLATE, WHITE], ['Top', SLATE, WHITE]],
    [['Small', 'D8D2CD', INK], ['Good', SLATE2, WHITE], ['Good', SLATE2, WHITE]],
    [['Weak', 'EDEAE7', INK], ['Decel', CORAL, WHITE], ['Decel', CORAL, WHITE]],
  ];
  segCells.forEach((r, i) => r.forEach(([t, f, c], j) => {
    s.addShape(pres.shapes.RECTANGLE, { x: rx + j * rw, y: ry + i * rh, w: rw - 0.06, h: rh - 0.06, fill: { color: f }, line: { color: WHITE } });
    s.addText(t, { x: rx + j * rw, y: ry + i * rh, w: rw - 0.06, h: rh - 0.06, fontFace: HEAD, fontSize: 17, bold: true, color: c, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  }));
  card(s, 5.6, 5.55, 7.13, 1.3);
  s.addText([
    { text: 'Decel = ', options: { bold: true, color: CORAL } },
    { text: 'des clientes qui achètent souvent ou beaucoup (FM moyen ou haut), mais dont le dernier achat date de plus de 150 jours : ', options: { color: INK } },
    { text: 'de la valeur, mais en train de s\'endormir.', options: { bold: true, color: INK } },
  ], { x: 5.85, y: 5.65, w: 6.7, h: 1.1, fontFace: BODY, fontSize: 14, valign: 'middle', margin: 0, isTextBox: true });
  s.addNotes("[0:50] Méthode du cours en deux temps. D'abord trois niveaux par critère, avec des seuils proches des tertiles, arrondis pour être lisibles par le métier. Ensuite on croise fréquence et montant en un score FM, puis FM et récence pour obtenir cinq segments ; les clientes dont la carte a moins d'un an sont isolées en New. Nos volumes reproduisent exactement ceux de référence. Les Decel sont des clientes à FM moyen ou haut, mais sans achat depuis plus de 150 jours.");
}

// ---------------------------------------------------------------- 6. Résultats
{
  const s = base('05 · Résultats de la segmentation', 'Top et Good : 29 % des clientes, 46 % du CA', { source: SRC });
  const segs = ['Top', 'Good', 'Decel', 'Small', 'Weak', 'New'];
  s.addChart(pres.charts.BAR, [
    { name: '% des clientes', labels: segs, values: [15.9, 12.8, 6.5, 12.2, 14.4, 38.0] },
    { name: "% du chiffre d'affaires", labels: segs, values: [28.3, 18.1, 7.0, 4.9, 5.4, 36.2] },
  ], {
    x: M, y: 1.5, w: 7.6, h: 5.35, barDir: 'col', barGrouping: 'clustered', chartColors: [GREY, BERRY], barGapWidthPct: 55,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0" %"', dataLabelFontSize: 11, dataLabelColor: INK,
    catAxisLabelColor: INK, catAxisLabelFontSize: 13, catAxisLabelFontFace: BODY, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 't', legendFontSize: 12, legendColor: INK, valAxisMaxVal: 45, valAxisMinVal: 0,
  });
  const rowsT = [['Segment', 'Clientes', 'CA moyen / an'], ['Top', '1 964', '473 €'], ['Good', '1 584', '375 €'], ['Decel', '806', '283 €'], ['Small', '1 510', '107 €'], ['Weak', '1 782', '100 €'], ['New', '4 694', '253 €'], ['Total', '12 340', '265 €']];
  s.addTable(rowsT.map((r, i) => r.map((c, j) => ({ text: c, options: {
    bold: i === 0 || r[0] === 'Decel' || r[0] === 'Total', color: i === 0 ? WHITE : (r[0] === 'Decel' ? CORAL : INK), fill: { color: i === 0 ? BERRY : (r[0] === 'Decel' ? 'FBE9E3' : WHITE) },
    fontFace: BODY, fontSize: 13, align: j === 0 ? 'left' : 'right', valign: 'middle',
  } }))), { x: 8.6, y: 1.75, w: 4.13, colW: [1.35, 1.3, 1.48], rowH: 0.42, border: { type: 'solid', color: 'E3D8DC', pt: 0.75 } });
  s.addText('Les New (carte de moins d\'un an) pèsent plus d\'un tiers de la base : la marque recrute beaucoup, l\'enjeu est de fidéliser.', { x: 8.6, y: 5.35, w: 4.13, h: 1.3, fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, valign: 'top', isTextBox: true });
  s.addNotes("[0:45] Résultat : une concentration classique de la valeur. Top et Good font 29 % des clientes et 46 % du CA. Les New sont très nombreuses, 38 % : la marque recrute beaucoup. Les Decel ne font que 6,5 % des clientes, et ce n'est pas pour leur taille que nous les avons choisies.");
}

// ---------------------------------------------------------------- 7. Pourquoi Decel
{
  const s = base('06 · Le segment choisi', 'Pourquoi les Decel ? Valeur, issue incertaine, lien avec la stratégie');
  const cards = [
    ['Valeur', '283 €', 'par cliente et par an, au-dessus de la moyenne (273 €, hors New). Panier moyen le plus élevé des clientes fidèles : 117 €. 228 k€ de CA au total.', BERRY],
    ['Issue incertaine', '1 sur 3', "remonte en Top/Good l'année suivante… et 1 sur 3 devient inactive (constaté sur les Decel 2014-15). C'est le moment d'agir.", CORAL],
    ['Lien avec la stratégie', '41 %', 'seulement avaient déjà acheté du bain avant sept. 2015, contre 53 % des Good et 59 % des Top : la nouvelle gamme a moins pris chez elles.', SLATE],
  ];
  cards.forEach(([t, v, d, col], i) => {
    const x = M + i * 4.1;
    card(s, x, 1.65, 3.85, 3.3);
    s.addText(t, { x: x + 0.3, y: 1.85, w: 3.3, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: col, margin: 0, isTextBox: true });
    s.addText(v, { x: x + 0.3, y: 2.3, w: 3.3, h: 0.95, fontFace: HEAD, fontSize: 48, bold: true, color: col, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(d, { x: x + 0.3, y: 3.35, w: 3.3, h: 1.5, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addText([
    { text: 'Pas un choix de taille : ', options: { bold: true, color: INK } },
    { text: '806 clientes (6,5 %), mais un segment où une action bien ciblée peut faire basculer des clientes de valeur du bon côté.', options: { color: MUTED } },
  ], { x: M, y: 5.25, w: W - 2 * M, h: 0.7, fontFace: BODY, fontSize: 15, margin: 0, valign: 'middle', isTextBox: true });
  s.addNotes("[1:00] Trois raisons. La valeur : 283 € par an, au-dessus de la moyenne, et le panier le plus élevé des clientes fidèles. L'incertitude : un an plus tard, un tiers remonte, un tiers disparaît ; c'est là qu'une action peut changer l'issue. Et le lien avec la stratégie : elles ont moins adopté le bain, la nouvelle gamme. Ce n'est donc pas un segment choisi parce qu'il est gros.");
}

// ---------------------------------------------------------------- 8. Profil comparé
{
  const s = base('07 · Profil', 'Un panier élevé, moins de visites, et aucune différence démographique', { source: SRC + ' · Base = clientes actives hors New' });
  const hdr = ['Indicateur (moyenne)', 'Decel', 'Good', 'Top', 'Base'];
  const data = [
    ['CA annuel', '283 €', '375 €', '473 €', '273 €'],
    ['Nombre de visites', '2,7', '3,6', '5,2', '2,9'],
    ['Panier moyen', '117 €', '111 €', '95 €', '101 €'],
    ['Produits par visite', '4,1', '3,9', '3,5', '3,5'],
    ['Familles de produits achetées', '4,4', '5,3', '6,3', '4,2'],
    ['Jours depuis le dernier achat', '220', '97', '33', '126'],
    ['Âge', '46 ans', '46 ans', '46 ans', '46 ans'],
    ['Ancienneté de la carte', '3,5 ans', '3,7 ans', '3,8 ans', '3,7 ans'],
  ];
  const t = [hdr, ...data].map((r, i) => r.map((c, j) => ({ text: c, options: {
    bold: i === 0 || j === 1, color: i === 0 ? WHITE : (j === 1 ? CORAL : INK), fill: { color: i === 0 ? BERRY : (j === 1 ? 'FBE9E3' : (i >= 7 ? 'F4F2F1' : WHITE)) },
    fontFace: BODY, fontSize: 13, align: j === 0 ? 'left' : 'center', valign: 'middle',
  } })));
  s.addTable(t, { x: M, y: 1.6, w: 7.6, colW: [2.9, 1.2, 1.15, 1.15, 1.2], rowH: 0.52, border: { type: 'solid', color: 'E3D8DC', pt: 0.75 } });
  const ins = [
    ['Des paniers riches', 'À saison égale (sept.-mars) : 104 € contre 98 € pour les Good et 93 € pour les Top.'],
    ['Mais moins de visites', '2,7 visites par an, et un dernier achat vieux de 220 jours en moyenne.'],
    ['Même profil que les autres', 'Âge, ancienneté, tailles identiques : le ciblage doit se faire sur les achats, pas sur la démographie.'],
  ];
  ins.forEach(([h, d], i) => {
    const y = 1.6 + i * 1.72;
    card(s, 8.6, y, 4.13, 1.52);
    s.addText(h, { x: 8.85, y: y + 0.15, w: 3.7, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: BERRY, margin: 0, isTextBox: true });
    s.addText(d, { x: 8.85, y: y + 0.55, w: 3.7, h: 0.9, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes("[0:45] Comparées aux Good, aux Top et à la base, les Decel ont un panier plus élevé, même à saison égale, mais viennent moins souvent. Surtout, rien ne les distingue démographiquement : même âge, même ancienneté, mêmes tailles. Conséquence directe pour l'action : on les cible par leurs achats, pas par leur profil.");
}

// ---------------------------------------------------------------- 9. Dernier achat
{
  const s = base('08 · Quand ont-elles décroché ?', '70 % des Decel ont fait leur dernier achat en janvier-mars 2016', { source: SRC });
  hiBar(s, { cats: ['sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars'], vals: [3, 5, 9, 12, 20, 20, 30], colorOf: (c, i) => (i >= 4 ? CORAL : 'E8B6A6'), x: M, y: 1.55, w: 7.2, h: 5.3, fontSize: 12, title: 'Mois du dernier achat des Decel (% des 806 clientes)' });
  card(s, 8.2, 1.65, 4.53, 2.35);
  s.addText('Ce que ça veut dire', { x: 8.45, y: 1.8, w: 4.1, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: BERRY, margin: 0, isTextBox: true });
  s.addText("Ce ne sont pas des clientes perdues depuis longtemps : leur dernier achat date de l'hiver. Avant la période, elles étaient déjà moins présentes au printemps-été (59 % contre 70 à 77 %). La fenêtre d'action est courte : relancer dès mars-avril.", { x: 8.45, y: 2.22, w: 4.1, h: 1.7, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
  card(s, 8.2, 4.2, 4.53, 2.6, 'F4F2F1');
  s.addText('Limite de la méthode', { x: 8.45, y: 4.35, w: 4.1, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: MUTED, margin: 0, isTextBox: true });
  s.addText("La récence est calculée au 31 août : une Decel a forcément acheté avant le 3 avril. Qu'elles n'achètent pas d'avril à août découle donc de la définition, pas d'un comportement. Nous avons analysé leur passé pour éviter ce piège.", { x: 8.45, y: 4.77, w: 4.1, h: 1.95, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
  s.addNotes("[0:45] 70 % des Decel ont fait leur dernier achat entre janvier et mars : elles étaient actives très récemment. Un point de méthode : comme la récence est mesurée au 31 août, une Decel a forcément acheté avant début avril. Dire qu'elles n'achètent pas l'été serait une tautologie ; nous avons donc étudié leur historique, avant la période.");
}

// ---------------------------------------------------------------- 10. Deux profils
{
  const s = base('09 · Historique', 'Deux profils de Decel, déjà moins présentes au printemps-été 2015', { source: 'Historique des tickets avant la période d\'étude · AH = automne-hiver (sept.-mars), PE = printemps-été (avr.-août)' });
  const lbl = ['AH 12-13', 'PE 2013', 'AH 13-14', 'PE 2014', 'AH 14-15', 'PE 2015'];
  s.addChart(pres.charts.LINE, [
    { name: 'Top', labels: lbl, values: [34, 35, 47, 52, 71, 77] },
    { name: 'Good', labels: lbl, values: [29, 28, 43, 43, 65, 70] },
    { name: 'Decel', labels: lbl, values: [26, 24, 38, 35, 65, 59] },
  ], {
    x: M, y: 1.55, w: 6.9, h: 5.3, chartColors: [SLATE, SLATE2, CORAL], lineSize: 3, lineDataSymbol: 'circle', lineDataSymbolSize: 8,
    showTitle: true, title: '% des clientes de chaque segment ayant acheté pendant la saison', titleFontSize: 12, titleColor: INK, titleFontFace: BODY,
    showLegend: true, legendPos: 't', legendFontSize: 12, legendColor: INK, catAxisLabelColor: MUTED, catAxisLabelFontSize: 11,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 10, valAxisMaxVal: 100, valAxisMinVal: 0, valAxisLabelFormatCode: '0" %"', valGridLine: { color: 'EEEAE8', size: 0.5 }, catGridLine: { style: 'none' },
  });
  const prof = [
    ['A', '479 clientes', 'Actives au PE 2015, pas au printemps 2016', '≈ 171 € dépensés chacune au printemps-été 2015 : ≈ 82 k€ au total, plafond de ce qui est récupérable sur une saison.', CORAL],
    ['B', '327 clientes', 'Sans achat au printemps-été 2015', "Pas des « saisonnières pures » : 46 % achetaient au printemps-été en 2013 ou 2014, mais pas en 2015.", BERRY],
  ];
  prof.forEach(([l, n, h, d, col], i) => {
    const y = 1.65 + i * 2.62;
    card(s, 7.85, y, 4.88, 2.42);
    chip(s, 8.1, y + 0.22, l, col);
    s.addText(n, { x: 8.75, y: y + 0.2, w: 3.8, h: 0.46, fontFace: HEAD, fontSize: 20, bold: true, color: col, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(h, { x: 8.1, y: y + 0.78, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'top', isTextBox: true });
    s.addText(d, { x: 8.1, y: y + 1.2, w: 4.4, h: 1.1, fontFace: BODY, fontSize: 13, color: MUTED, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes("[0:50] Avant même la période d'étude, les Decel étaient moins présentes au printemps-été 2015 : 59 %, contre 70 % des Good et 77 % des Top, alors qu'elles étaient aussi présentes que les Good l'hiver précédent. Cela dessine deux profils : A, 479 clientes qui achetaient au printemps-été 2015 et ne sont pas revenues ; B, 327 clientes déjà absentes l'été 2015, mais qui achetaient l'été les années d'avant. La hausse générale des courbes vient surtout de l'ancienneté des cartes.");
}

// ---------------------------------------------------------------- 11. Gammes
{
  const s = base('10 · Produits', 'Les nouvelles gammes ont moins pris chez les Decel, surtout le bain', { source: 'Achats avant le 01/09/2015, parmi les clientes ayant un historique · Homewear : 74 % de son CA de septembre à mars (54 % pour l\'ensemble)' });
  const segs = ['Decel', 'Good', 'Top'];
  const colorOf = (c) => (c === 'Decel' ? CORAL : (c === 'Good' ? SLATE2 : SLATE));
  hiBar(s, { cats: segs, vals: [41, 53, 59], colorOf, x: M, y: 1.55, w: 3.9, h: 4.2, max: 70, fontSize: 13, title: 'Ont déjà acheté du bain (%)' });
  hiBar(s, { cats: segs, vals: [42, 46, 55], colorOf, x: 4.7, y: 1.55, w: 3.9, h: 4.2, max: 70, fontSize: 13, title: 'Ont déjà acheté du homewear (%)' });
  s.addText("Un écart net sur le bain (-12 à -18 points), plus léger sur le homewear. L'effet de l'ancienneté (3,5 ans contre 3,8 pour les Top) ne suffit pas à l'expliquer.", { x: M, y: 5.9, w: 8.0, h: 0.9, fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, valign: 'top', isTextBox: true });
  const lev = [
    ['Le bain, raison de revenir au printemps', 'Le printemps-été, où elles étaient déjà moins présentes, est la saison du maillot. Taille complète connue pour 61 % des Decel : une sélection à leur taille rend le message utile.'],
    ['Le homewear, levier de la rentrée', '74 % du CA homewear se fait de septembre à mars, la saison où les Decel sont actives.'],
  ];
  lev.forEach(([h, d], i) => {
    const y = 1.65 + i * 2.6;
    card(s, 8.9, y, 3.83, 2.4);
    s.addText(h, { x: 9.15, y: y + 0.18, w: 3.35, h: 0.75, fontFace: BODY, fontSize: 15, bold: true, color: BERRY, margin: 0, valign: 'top', isTextBox: true });
    s.addText(d, { x: 9.15, y: y + 0.95, w: 3.35, h: 1.35, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes("[0:45] Avant la période, 41 % des Decel avaient déjà acheté du bain, contre 53 % des Good et 59 % des Top. L'écart est plus léger sur le homewear. Deux leviers produit : le bain pour les faire revenir au printemps, avec une sélection à leur taille puisqu'on connaît la taille de 61 % d'entre elles ; et le homewear, un produit d'automne-hiver, pour la rentrée.");
}

// ---------------------------------------------------------------- 12. Migration
{
  const s = base('11 · Migration (bonus)', "D'une année sur l'autre, la base est très mobile", { source: 'Segmentation recalculée sur sept. 2014 – août 2015 avec les mêmes seuils · Lecture en ligne : devenir en 2015-16 des clientes de chaque segment 2014-15' });
  const cols = ['Top', 'Good', 'Decel', 'Small', 'Weak', 'Inactive'];
  const rowsM = [
    ['Top', 37.2, 19.7, 7.2, 10.3, 9.9, 15.8], ['Good', 28.1, 21.4, 7.2, 10.2, 12.5, 20.6], ['Decel', 16.7, 15.0, 10.9, 13.1, 13.8, 30.6],
    ['Small', 9.9, 10.2, 5.0, 13.7, 14.8, 46.4], ['Weak', 6.7, 7.9, 4.6, 10.8, 13.7, 56.3], ['New', 12.9, 11.7, 6.7, 9.0, 12.2, 47.4], ['Réactivées*', 12.7, 12.8, 8.9, 31.3, 34.3, null],
  ];
  const shade = (v) => {
    if (v === null) return 'F4F2F1';
    const t = Math.min(v / 60, 1);
    const a = [255, 255, 255], b = [63, 95, 127];
    return a.map((x, k) => Math.round(x + (b[k] - x) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const hdr = [{ text: '2014-15 ↓   2015-16 →', options: { bold: true, color: WHITE, fill: { color: BERRY }, fontSize: 11, align: 'left' } }]
    .concat(cols.map(c => ({ text: c, options: { bold: true, color: WHITE, fill: { color: c === 'Decel' ? CORAL : BERRY }, fontSize: 12, align: 'center' } })));
  const body = rowsM.map(r => [{ text: r[0], options: { bold: true, color: r[0] === 'Decel' ? CORAL : INK, fill: { color: TINT }, fontSize: 12, align: 'left' } }]
    .concat(r.slice(1).map(v => ({ text: v === null ? '–' : `${Math.round(v)} %`, options: { color: v !== null && v > 36 ? WHITE : INK, fill: { color: shade(v) }, fontSize: 12, align: 'center', bold: v !== null && v > 36 } }))));
  s.addTable([hdr, ...body], { x: M, y: 1.6, w: 7.9, colW: [1.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], rowH: 0.56, fontFace: BODY, valign: 'middle', border: { type: 'solid', color: WHITE, pt: 1.5 } });
  s.addText('* clientes inactives en 2014-15 qui ont racheté en 2015-16', { x: M, y: 6.2, w: 7.9, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0, isTextBox: true });
  const ins = [
    ['37 %', 'seulement des Top restent Top un an plus tard'],
    ['47 %', 'des New ne rachètent rien la deuxième année'],
    ['35 %', 'des Decel 2016 étaient New en 2014-15 (29 % dans l\'ensemble de la base) : pas de profil d\'origine type'],
  ];
  ins.forEach(([v, l], i) => {
    const y = 1.6 + i * 1.62;
    card(s, 8.95, y, 3.78, 1.45);
    s.addText(v, { x: 9.15, y: y + 0.12, w: 1.45, h: 1.2, fontFace: HEAD, fontSize: 30, bold: true, color: i === 2 ? CORAL : BERRY, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(l, { x: 10.6, y: y + 0.12, w: 2.0, h: 1.2, fontFace: BODY, fontSize: 12, color: INK, margin: 0, valign: 'middle', isTextBox: true });
  });
  s.addNotes("[0:50] Bonus : nous avons recalculé la segmentation sur l'année précédente, avec les mêmes seuils, et croisé les deux. La base est très mobile : seules 37 % des Top restent Top, et près d'une New sur deux ne rachète rien la deuxième année. Les Decel 2016 viennent de tous les segments, avec un léger surpoids de clientes en deuxième année de carte : il n'y a pas de profil d'origine type.");
}

// ---------------------------------------------------------------- 13. Statut transitoire
{
  const s = base('12 · Migration des Decel', 'Le statut Decel est transitoire : un tiers remonte, un tiers disparaît', { source: 'Decel 2014-15 (588 clientes) suivies en 2015-16 · Aucune donnée de campagne : on ne sait pas si ces remontées ont été provoquées' });
  hiBar(s, { cats: ['Remontées en Top/Good', 'Toujours Decel', 'Descendues en Small/Weak', 'Inactives'], vals: [32, 11, 27, 31], colorOf: (c, i) => [SLATE, CORAL, GREY, '8A8580'][i], x: M, y: 1.55, w: 6.2, h: 5.2, dir: 'bar', fontSize: 12, max: 40, title: 'Devenir en 2015-16 des 588 Decel de 2014-15 (%)' });
  s.addText('Passage en Top/Good un an plus tard, selon le segment de départ', { x: 7.3, y: 1.6, w: 5.4, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: INK, margin: 0, isTextBox: true });
  const mv = [['Segment 2014-15', 'En Top/Good', 'Inactives'], ['Top', '57 %', '16 %'], ['Good', '50 %', '21 %'], ['Decel', '32 %', '31 %'], ['New', '25 %', '47 %'], ['Small', '20 %', '46 %'], ['Weak', '15 %', '56 %']];
  s.addTable(mv.map((r, i) => r.map((c, j) => ({ text: c, options: {
    bold: i === 0 || r[0] === 'Decel', color: i === 0 ? WHITE : (r[0] === 'Decel' ? CORAL : INK), fill: { color: i === 0 ? BERRY : (r[0] === 'Decel' ? 'FBE9E3' : WHITE) },
    fontFace: BODY, fontSize: 13, align: j === 0 ? 'left' : 'center', valign: 'middle',
  } }))), { x: 7.3, y: 2.05, w: 5.43, colW: [2.03, 1.7, 1.7], rowH: 0.44, border: { type: 'solid', color: 'E3D8DC', pt: 0.75 } });
  card(s, 7.3, 5.3, 5.43, 1.45);
  s.addText("Les Decel gardent un potentiel de retour nettement supérieur aux petits segments, pour un risque d'inactivité encore contenu : une cible de réactivation pertinente.", { x: 7.5, y: 5.38, w: 5.05, h: 1.3, fontFace: BODY, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
  s.addNotes("[0:45] Que deviennent les Decel ? Sur les 588 Decel de 2014-15, seules 11 % le sont restées : un tiers est remonté en Top ou Good, un tiers est devenu inactif. Comparées aux autres segments, elles ont moins de chances de remonter que les Good, mais bien plus que les New, les Small ou les Weak. Réserve : sans données de campagne, on ne sait pas si ces remontées étaient provoquées.");
}

// ---------------------------------------------------------------- 14. Plan d'action
{
  const s = base('13 · Recommandations', 'Un plan en trois priorités, sans remise, mesuré contre un groupe témoin');
  const acts = [
    ['P1', 'Rentrée « bon retour »', 'Tous les Decel · sept.-oct.', 'Dès leur identification au 31/08 : invitation à découvrir la collection automne, mise en avant du homewear.', 'E-mail / SMS', CORAL],
    ['P1', 'Relance de printemps', 'Profil A (479) · mars-avril', 'Invitation en boutique : collection printemps-été et maillots à leur taille ; cadeau conditionné à un achat.', 'E-mail / SMS + appel vendeuse (20 boutiques)', CORAL],
    ['P2', 'Alerte « pré-Decel »', 'Good sans achat depuis 90 j · en continu', '372 Good à 121-150 j : contact personnel. 450 à 91-120 j : relance légère.', 'CRM + boutique', SLATE],
    ['P3', 'Découverte du bain', 'Profil B (327) · avril-juin', 'Essayage sur rendez-vous et conseil taille pour des clientes qui se sont éloignées de l\'été.', 'Courrier / e-mail + boutique', BERRY],
  ];
  acts.forEach(([p, t, c, d, ch, col], i) => {
    const x = M + (i % 2) * 6.15, y = 1.55 + Math.floor(i / 2) * 2.35;
    card(s, x, y, 5.95, 2.18);
    chip(s, x + 0.25, y + 0.22, p, col, WHITE, 0.6);
    s.addText(t, { x: x + 1.0, y: y + 0.18, w: 4.75, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c, { x: x + 1.0, y: y + 0.65, w: 4.75, h: 0.32, fontFace: BODY, fontSize: 12, bold: true, color: col, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.25, y: y + 1.02, w: 5.5, h: 0.75, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
    s.addText('Canal : ' + ch, { x: x + 0.25, y: y + 1.75, w: 5.5, h: 0.32, fontFace: BODY, fontSize: 11, italic: true, color: MUTED, margin: 0, isTextBox: true });
  });
  card(s, M, 6.3, W - 2 * M, 0.6, 'F4F2F1');
  s.addText([
    { text: 'Transversal : ', options: { bold: true, color: INK } },
    { text: 'récompenser par des cadeaux, avant-premières et services (déjà dans les codes de la marque), pas par des remises. ', options: { color: INK } },
    { text: 'Indicateur principal : réachat payant sous 8 semaines, comparé à un groupe témoin.', options: { bold: true, color: BERRY } },
  ], { x: M + 0.25, y: 6.3, w: W - 2 * M - 0.5, h: 0.6, fontFace: BODY, fontSize: 12, margin: 0, valign: 'middle', isTextBox: true });
  s.addNotes("[0:50] Notre plan en trois priorités. P1 : deux temps forts. À la rentrée, dès qu'elles deviennent Decel, un message « bon retour » centré sur la collection automne et le homewear. Au printemps, une relance du profil A avec une sélection de maillots à leur taille et un cadeau conditionné à un achat. P2 : prévenir, avec une alerte graduée pour les Good qui tardent à racheter. P3 : faire découvrir le bain au profil B. Pas de remise : la marque n'en pratique presque pas, ce serait incohérent avec son positionnement, comme dans l'étude de cas du cours. On récompense par des cadeaux et des services.");
}

// ---------------------------------------------------------------- 15. Leviers
{
  const s = base('14 · Leviers opérationnels', 'La boutique pour contacter, une alerte pour prévenir', { source: 'Backtest : clientes Top et Good 2014-15 selon le délai depuis leur dernier achat au 31/08/2015, suivies en 2015-16' });
  card(s, M, 1.6, 5.4, 5.2);
  s.addText('La boutique, canal naturel', { x: M + 0.3, y: 1.8, w: 4.8, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: BERRY, margin: 0, isTextBox: true });
  const bs = [['64 %', 'des visites des Decel se font dans leur boutique de rattachement (62 % pour la base)'], ['≈ 9', 'Decel par boutique (87 boutiques) : une liste d\'appel réaliste pour chaque équipe'], ['43 %', 'des Decel rattachées aux 20 premières boutiques, qui peuvent tester l\'appel de la vendeuse']];
  bs.forEach(([v, l], i) => {
    const y = 2.4 + i * 1.4;
    s.addText(v, { x: M + 0.3, y, w: 1.5, h: 1.1, fontFace: HEAD, fontSize: 32, bold: true, color: BERRY, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(l, { x: M + 1.85, y, w: 3.3, h: 1.1, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'middle', isTextBox: true });
  });
  hiBar(s, { cats: ['0-30 j', '31-60 j', '61-90 j', '91-120 j', '121-150 j'], vals: [20, 25, 25, 30, 32], colorOf: (c, i) => (i >= 3 ? BERRY : GREY), x: 6.3, y: 1.55, w: 6.43, h: 3.9, max: 40, fontSize: 12, title: 'Risque de devenir Decel ou inactive l\'année suivante (%)' });
  s.addText([
    { text: 'Le risque augmente avec le délai depuis le dernier achat, ', options: { color: INK } },
    { text: 'mais reste un signal faible ', options: { bold: true, color: INK } },
    { text: '(3 alertées sur 10 décrochent). D\'où une alerte graduée : contact personnel à 121-150 jours, relance légère à 91-120 jours.', options: { color: INK } },
  ], { x: 6.4, y: 5.6, w: 6.3, h: 1.2, fontFace: BODY, fontSize: 13, margin: 0, valign: 'top', isTextBox: true });
  s.addNotes("[0:45] Deux leviers opérationnels. La boutique : deux tiers des visites se font dans la boutique de rattachement, et il y a environ 9 Decel par boutique, donc chaque équipe peut appeler ses clientes. L'alerte : sur l'année précédente, le risque de décrocher monte de 20 % à 32 % avec le délai depuis le dernier achat. C'est un signal faible, d'où une alerte graduée.");
}

// ---------------------------------------------------------------- 16. Mesure et rentabilité
{
  const s = base('15 · Mesure et rentabilité', "Mesurer sur tout le segment, et viser au moins +10 points de réachat", { source: 'Hypothèses : 70 % contactées, réachat naturel 20 % en 8 semaines, panier 117 €, cadeau 10 € pour toute cliente qui rachète · CA, pas marge (non disponible)' });
  card(s, M, 1.6, 5.1, 3.95);
  s.addText('Un test A/B dimensionné', { x: M + 0.3, y: 1.8, w: 4.5, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: BERRY, margin: 0, isTextBox: true });
  bullets(s, [
    [{ text: 'Groupe témoin de 30 % ', bold: true }, { text: 'non contacté : sans lui, impossible de distinguer l\'effet de la campagne des retours spontanés (1 Decel sur 5 rachète d\'elle-même en 8 semaines).' }],
    [{ text: 'Effet minimal détectable : ', bold: true }, { text: '+9,5 points sur les 806 Decel, mais +14,5 points sur les seules 20 boutiques pilotes.' }],
    [{ text: 'Donc : ', bold: true }, { text: 'mesurer sur tout le segment, cumuler deux vagues (rentrée + printemps), et réserver les 20 boutiques au test de l\'appel vendeuse.' }],
  ], M + 0.3, 2.35, 4.5, 3.1, 13);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.75, w: 5.1, h: 1.05, fill: { color: PLUM }, line: { color: PLUM }, rectRadius: 0.08 });
  s.addText([
    { text: 'Objectif de la campagne', options: { bold: true, color: 'F2B8A6', breakLine: true } },
    { text: '+10 points de réachat payant en 8 semaines, face au groupe témoin', options: { color: WHITE } },
  ], { x: M + 0.3, y: 5.8, w: 4.6, h: 0.95, fontFace: BODY, fontSize: 14, margin: 0, valign: 'middle', isTextBox: true });
  s.addText("CA incrémental / coût de la campagne", { x: 6.1, y: 1.65, w: 6.6, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: INK, margin: 0, isTextBox: true });
  const sc = [['Hausse du réachat', '+5 pts', '+10 pts', '+15 pts'], ['Contact digital (1 €)', '1,7', '2,9', '3,9'], ['Appel vendeuse (4 €)', '0,9', '1,7', '2,3'], ['Clientes réactivées en plus', '28', '56', '85']];
  s.addTable(sc.map((r, i) => r.map((c, j) => ({ text: c, options: {
    bold: i === 0 || j === 0, color: i === 0 ? WHITE : ((i === 1 || i === 2) && j === 1 ? CORAL : INK), fill: { color: i === 0 ? BERRY : (j === 0 ? TINT : WHITE) },
    fontFace: BODY, fontSize: 14, align: j === 0 ? 'left' : 'center', valign: 'middle',
  } }))), { x: 6.1, y: 2.1, w: 6.63, colW: [2.73, 1.3, 1.3, 1.3], rowH: 0.52, border: { type: 'solid', color: 'E3D8DC', pt: 0.75 } });
  const reads = [
    ['À +5 points, pas rentable', 'Le cadeau profite aussi aux clientes qui seraient revenues seules (effet d\'aubaine), et le ratio porte sur du CA, pas de la marge.'],
    ['Pour améliorer le rapport', 'Conditionner le cadeau (par exemple à l\'achat d\'un maillot) et réserver l\'appel aux clientes les plus précieuses.'],
  ];
  reads.forEach(([h, d], i) => {
    const y = 4.35 + i * 1.25;
    s.addText(h, { x: 6.1, y, w: 6.6, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: BERRY, margin: 0, isTextBox: true });
    s.addText(d, { x: 6.1, y: y + 0.37, w: 6.6, h: 0.8, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes("[0:45] Pour savoir si ça marche, un groupe témoin de 30 % est indispensable, car une Decel sur cinq rachète d'elle-même. Avec 806 clientes, on ne détecte qu'un effet d'environ 10 points : il faut donc mesurer sur tout le segment, pas sur un petit pilote. Côté rentabilité, en comptant l'effet d'aubaine du cadeau, la campagne n'est intéressante qu'à partir d'environ +10 points de réachat. D'où un cadeau conditionné et un appel vendeuse réservé aux clientes les plus précieuses.");
}

// ---------------------------------------------------------------- 17. Calendrier
{
  const s = base('16 · Calendrier', 'Deux temps forts, rentrée et printemps, sur un socle continu');
  const months = ['sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août'];
  const lx = M + 3.9, lw = W - M - lx, mw = lw / 12, ty = 1.55;
  months.forEach((m, i) => {
    s.addText(m, { x: lx + i * mw, y: ty, w: mw, h: 0.35, fontFace: BODY, fontSize: 12, color: MUTED, align: 'center', margin: 0, isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: lx + i * mw, y: ty + 0.45, w: 0, h: 4.45, line: { color: 'EEEAE8', width: 0.75 } });
  });
  s.addShape(pres.shapes.LINE, { x: lx + lw, y: ty + 0.45, w: 0, h: 4.45, line: { color: 'EEEAE8', width: 0.75 } });
  const lanes = [
    ['P1 · Rentrée « bon retour »', 'Tous les Decel', 0, 2, CORAL],
    ['P1 · Relance de printemps', 'Profil A', 6, 8, CORAL],
    ['P2 · Alerte « pré-Decel » graduée', 'Good sans achat depuis 90 j', 0, 12, SLATE],
    ['P3 · Découverte du bain', 'Profil B', 7, 10, BERRY],
    ['Récompenses sans remise', 'Programme de fidélité', 0, 12, GREY],
    ['Mesure vs témoin, RFM trimestriel', 'Équipe data / CRM', 0, 12, '5E5559'],
  ];
  lanes.forEach(([n, c, a, b, col], i) => {
    const y = ty + 0.6 + i * 0.72;
    s.addText(n, { x: M, y, w: 3.75, h: 0.34, fontFace: BODY, fontSize: 13, bold: true, color: INK, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(c, { x: M, y: y + 0.32, w: 3.75, h: 0.28, fontFace: BODY, fontSize: 11, color: MUTED, margin: 0, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: lx + a * mw + 0.04, y: y + 0.05, w: (b - a) * mw - 0.08, h: 0.48, fill: { color: col }, line: { color: col }, rectRadius: 0.08 });
  });
  s.addText("Au 31 août : identification des nouvelles Decel → rentrée. En mars-avril : avant la saison du bain, où elles étaient déjà moins présentes → printemps.", { x: M, y: 6.55, w: W - 2 * M, h: 0.35, fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, isTextBox: true });
  s.addNotes("[0:15] Sur une année : la rentrée, dès que les Decel sont identifiées au 31 août ; le printemps, avant la saison du bain, pour le profil A puis le profil B. En continu : l'alerte, les récompenses et la mesure, avec un RFM recalculé chaque trimestre.");
}

// ---------------------------------------------------------------- 18. Conclusion
{
  const s = pres.addSlide(); slideNo += 1;
  s.background = { color: PLUM };
  s.addText('17 · CONCLUSION', { x: M, y: 0.45, w: 8, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: 'D9A7B8', charSpacing: 2, margin: 0, isTextBox: true });
  s.addText('Des clientes de valeur à reconquérir au bon moment', { x: M, y: 0.8, w: W - 2 * M, h: 0.75, fontFace: HEAD, fontSize: 28, bold: true, color: WHITE, margin: 0, isTextBox: true });
  const col = (x, title, items) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.85, w: 3.85, h: 3.9, fill: { color: '3B2835' }, line: { color: '3B2835' }, rectRadius: 0.08 });
    s.addText(title, { x: x + 0.3, y: 2.05, w: 3.3, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: 'F2B8A6', margin: 0, isTextBox: true });
    bullets(s, items, x + 0.3, 2.6, 3.3, 3.0, 15, 'F1E6EA');
  };
  col(M, 'À retenir', [
    '806 Decel : 7 % du CA, le panier le plus élevé des clientes fidèles.',
    'Dernier achat l\'hiver ; déjà moins présentes l\'été avant la période (59 % contre 70 à 77 %) et moins adeptes du bain.',
    'Statut transitoire : un tiers remonte, un tiers disparaît. Agir tôt.',
  ]);
  col(M + 4.1, 'Limites', [
    'Récence au 31 août : dépend de la saison du dernier achat.',
    'Seuils fixes, une seule année de migration.',
    'Pas de données de campagnes, de marge, d\'e-mail : scénarios en ordre de grandeur.',
  ]);
  col(M + 8.2, 'Prochaines étapes', [
    'Lancer P1 à la rentrée avec un groupe témoin de 30 %.',
    'Collecter l\'historique des contacts et la marge.',
    'Passer à un RFM glissant et à un score de risque de décrochage (projet 2).',
  ]);
  s.addText([
    { text: 'Décision demandée : ', options: { bold: true, color: 'F2B8A6' } },
    { text: 'lancer P1 à la rentrée sur tout le segment, avec un groupe témoin de 30 % (budget estimé de 2 à 4 k€ par vague).', options: { color: WHITE } },
  ], { x: M, y: 5.95, w: W - 2 * M, h: 0.5, fontFace: BODY, fontSize: 15, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('Merci. Questions ?', { x: M, y: 6.6, w: 8, h: 0.5, fontFace: HEAD, fontSize: 22, bold: true, color: 'D9A7B8', margin: 0, isTextBox: true });
  s.addNotes("[1:00] Pour conclure : les Decel sont des clientes de valeur, actives récemment, déjà moins présentes l'été avant la période et moins adeptes du bain. Leur statut est transitoire : c'est le bon moment pour agir. Nos limites : une récence sensible à la saison, des seuils fixes, et l'absence de données de campagne et de marge. Nous vous demandons de valider le lancement de la rentrée sur tout le segment avec un groupe témoin. Ensuite : collecter l'historique des contacts, et passer à un RFM glissant. Merci, nous sommes prêts pour vos questions.");
}

// ---------------------------------------------------------------- Annexe
{
  const s = base('Annexe A', "Peut-on prédire qui deviendra Decel ? Pas avec l'historique seul", { source: 'Arbre de décision (profondeur 3) sur les clientes Top, Good et Decel · variables calculées avant le 01/09/2015 · effectifs réels' });
  s.addImage({ path: path.join(__dirname, 'arbre_crop.png'), x: M, y: 1.5, w: W - 2 * M, h: (W - 2 * M) / 2.581 });
  s.addText([
    { text: 'AUC ≈ 0,56 ', options: { bold: true, color: BERRY, fontSize: 18, fontFace: HEAD } },
    { text: "en validation croisée, à peine mieux que le hasard (0,5) : toutes les feuilles restent majoritairement Top/Good. Variables qui ressortent : visites l'an passé, part des achats l'été, achat de bain. D'où une alerte en continu plutôt qu'un ciblage figé.", options: { color: INK } },
  ], { x: M, y: 6.3, w: W - 2 * M, h: 0.65, fontFace: BODY, fontSize: 12, margin: 0, valign: 'middle', isTextBox: true });
  s.addNotes("Annexe à montrer si la question est posée : un arbre de décision, vu en cours, ne prédit presque rien (AUC 0,56). C'est un résultat en soi, qui justifie une alerte en continu.");
}
{
  const s = base('Annexe B', 'Choix méthodologiques et contrôles', { source: 'Notebooks : Notebook_project1_completed, Analyse_Decel, Migration, Recommandations' });
  const items = [
    ['Contrôles', 'Toutes les valeurs de contrôle du notebook sont reproduites (119 215 lignes, 12 444 clientes, individus 4, 99, 557, 1396…) et les volumes de segments sont identiques à la référence.'],
    ['Récence « haute »', '≤ 60 jours (borne incluse) : seule convention qui redonne les volumes de référence (Top 1 964, Good 1 584).'],
    ['Nouvelles clientes', 'Carte de moins d\'un an (365 jours) au 31/08/2016 : 4 694 New.'],
    ['Remises', 'Remise en valeur recalculée selon les règles du sujet ; 7 lignes aberrantes (remise > 100 %) sans impact sur le RFM.'],
    ['Migration', 'N-1 = sept. 2014 – août 2015, périodes disjointes, mêmes seuils ; la fonction de segmentation redonne 2015-16 client par client.'],
    ['Contrôles croisés', 'Recalcul indépendant des principaux chiffres à partir des CSV bruts, et chaque notebook ré-exécuté de bout en bout.'],
  ];
  items.forEach(([h, d], i) => {
    const x = M + (i % 2) * 6.15, y = 1.6 + Math.floor(i / 2) * 1.75;
    card(s, x, y, 5.95, 1.55);
    s.addText(h, { x: x + 0.25, y: y + 0.15, w: 5.45, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: BERRY, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.25, y: y + 0.52, w: 5.45, h: 0.95, fontFace: BODY, fontSize: 12, color: INK, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addNotes('Annexe à utiliser pendant les questions sur la méthode.');
}

pres.writeFile({ fileName: OUT }).then(f => console.log('written', f));
