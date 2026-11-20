// Thème commun du deck Projet 2 (style épuré hérité du Projet 1, palette verte « supermarché »).
// Usage dans une section : module.exports = (T) => { const { pres, C, base, card, ... } = T; ... }
const pptxgen = require('pptxgenjs');

module.exports = function makeTheme() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 pouces
  pres.title = 'Prédire le rachat du mois prochain — Projet 2 Marketing Econometrics';

  // ---- Palette (vert supermarché + orange « fruit » en accent)
  const C = {
    DEEP: '0E3B2B',     // fond des slides titre / de clôture
    GREEN: '1F7A4D',    // couleur principale (kickers, chiffres clés, puces)
    LEAF: '5DAA6F',     // vert clair (séries secondaires)
    MINT: 'D6E9DC',     // aplats doux
    TINT: 'EFF6F1',     // fond des cartes
    ORANGE: 'F08A24',   // accent : à utiliser avec parcimonie (point à retenir, série mise en avant)
    SLATE: '3F5F7F',    // série de comparaison (bleu-gris)
    SLATE2: '9DB2C6',
    INK: '15201B',      // texte
    MUTED: '5F6B64',    // texte secondaire
    GREY: 'BDC6C0',     // barres neutres
    WHITE: 'FFFFFF',
  };
  const FONT = { HEAD: 'Georgia', BODY: 'Calibri' };
  const W = 13.333, M = 0.6;
  const NB = ' ';

  const T = { pres, C, FONT, W, M, slideNo: 0 };

  // ---- Typographie française : espaces insécables avant % € : ? ! ; » et dans les milliers
  function fr(t) {
    if (typeof t !== 'string') return t;
    return t.replace(/(\d) (?=\d{3}\b)/g, '$1' + NB).replace(/ (%|€|:|\?|!|;|»)/g, NB + '$1')
      .replace(/« /g, '«' + NB).replace(/(\d) (j|pts|ans|k€|jours|points)\b/g, '$1' + NB + '$2');
  }
  function frRuns(t) {
    return Array.isArray(t) ? t.map(r => (typeof r === 'object' && r.text !== undefined ? Object.assign({}, r, { text: fr(r.text) }) : r)) : fr(t);
  }
  const _addSlide = pres.addSlide.bind(pres);
  pres.addSlide = function (...a) {
    const sl = _addSlide(...a);
    const at = sl.addText.bind(sl), tb = sl.addTable.bind(sl);
    sl.addText = (t, o) => at(frRuns(t), o);
    sl.addTable = (rows, o) => tb(rows.map(r => r.map(c => (typeof c === 'object' ? Object.assign({}, c, { text: fr(c.text) }) : fr(c)))), o);
    return sl;
  };
  T.fr = fr;

  // ---- Slide de contenu : kicker (section), titre-message, source, numéro
  T.base = function base(kicker, title, opts = {}) {
    const s = pres.addSlide();
    T.slideNo += 1;
    s.background = { color: C.WHITE };
    if (kicker) s.addText(kicker.toUpperCase(), { x: M, y: 0.32, w: 9, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 2, margin: 0, isTextBox: true });
    if (title) s.addText(title, { x: M, y: 0.62, w: W - 2 * M, h: 0.75, fontFace: FONT.HEAD, fontSize: opts.titleSize || 26, bold: true, color: C.INK, margin: 0, valign: 'top', isTextBox: true });
    if (opts.source) s.addText(opts.source, { x: M, y: 7.02, w: 10.5, h: 0.28, fontFace: FONT.BODY, fontSize: 9, color: C.MUTED, margin: 0, isTextBox: true });
    s.addText(String(T.slideNo), { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.28, fontFace: FONT.BODY, fontSize: 9, color: C.MUTED, align: 'right', margin: 0, isTextBox: true });
    return s;
  };

  // ---- Slide sombre (titre, intermède, clôture)
  T.dark = function dark() {
    const s = pres.addSlide();
    T.slideNo += 1;
    s.background = { color: C.DEEP };
    return s;
  };

  // ---- Briques
  T.card = function card(s, x, y, w, h, fill = C.TINT) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
  };
  T.chip = function chip(s, x, y, label, fill = C.GREEN, color = C.WHITE, w = 0.5) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.42, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
    s.addText(label, { x, y, w, h: 0.42, fontFace: FONT.BODY, fontSize: 13, bold: true, color, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  };
  // Chiffre clé + légende (h total ≈ 1,3)
  T.stat = function stat(s, x, y, w, value, label, color = C.GREEN, vsize = 34) {
    s.addText(value, { x, y, w, h: 0.7, fontFace: FONT.HEAD, fontSize: vsize, bold: true, color, margin: 0, valign: 'bottom', isTextBox: true });
    s.addText(label, { x, y: y + 0.72, w, h: 0.6, fontFace: FONT.BODY, fontSize: 12, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
  };
  // Liste à puces ; chaque item = string ou tableau de runs [{text, bold, color}]
  T.bullets = function bullets(s, items, x, y, w, h, size = 14, color = C.INK) {
    const arr = items.map((t, i) => {
      const runs = Array.isArray(t) ? t : [{ text: t }];
      return runs.map((r, j) => ({
        text: r.text, options: Object.assign({ bold: !!r.bold, color: r.color || color },
          j === 0 ? { bullet: { indent: 14 }, paraSpaceAfter: 6 } : {}, (j === runs.length - 1 && i < items.length - 1) ? { breakLine: true } : {}),
      }));
    }).flat();
    s.addText(arr, { x, y, w, h, fontFace: FONT.BODY, fontSize: size, color, valign: 'top', margin: 0, isTextBox: true });
  };
  // Bandeau « À retenir » en bas de slide (y = 6.2, h = 0.65)
  T.takeaway = function takeaway(s, text, y = 6.2) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: W - 2 * M, h: 0.65, fill: { color: C.DEEP }, line: { color: C.DEEP }, rectRadius: 0.08 });
    s.addShape(pres.shapes.RECTANGLE, { x: M, y: y + 0.12, w: 0.08, h: 0.41, fill: { color: C.ORANGE }, line: { color: C.ORANGE } });
    s.addText(text, { x: M + 0.3, y, w: W - 2 * M - 0.5, h: 0.65, fontFace: FONT.BODY, fontSize: 15, bold: true, color: C.WHITE, margin: 0, valign: 'middle', isTextBox: true });
  };
  // Image insérée sans déformation dans une boîte (x,y,w,h)
  T.img = function img(s, path, x, y, w, h) {
    s.addImage({ path, x, y, w, h, sizing: { type: 'contain', w, h } });
  };
  T.pctFmt = () => '0" %";;;';
  // Barres avec catégories colorées individuellement (une série empilée par couleur, zéros masqués)
  T.hiBar = function hiBar(s, { cats, vals, colorOf, x, y, w, h, dir = 'col', fmt = T.pctFmt(), max, title, fontSize = 11, labelColor = C.WHITE, labelPos = 'inEnd' }) {
    const colors = [...new Set(cats.map((c, i) => colorOf(c, i)))];
    const data = colors.map(col => ({ name: col, labels: cats, values: vals.map((v, i) => (colorOf(cats[i], i) === col ? v : 0)) }));
    const o = {
      x, y, w, h, barDir: dir === 'col' ? 'col' : 'bar', barGrouping: 'stacked', chartColors: colors, barGapWidthPct: 60,
      showValue: true, dataLabelPosition: labelPos, dataLabelFormatCode: fmt, dataLabelFontSize: fontSize, dataLabelColor: labelColor, dataLabelFontBold: true,
      catAxisLabelColor: C.MUTED, catAxisLabelFontSize: fontSize, catAxisLabelFontFace: FONT.BODY, valAxisHidden: true, valGridLine: { style: 'none' },
      catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false, valAxisLineShow: false,
    };
    if (dir !== 'col') o.catAxisOrientation = 'maxMin';
    if (max !== undefined) { o.valAxisMaxVal = max; o.valAxisMinVal = 0; }
    if (title) { o.showTitle = true; o.title = title; o.titleFontSize = 12; o.titleColor = C.INK; o.titleFontFace = FONT.BODY; }
    s.addChart(pres.charts.BAR, data, o);
  };
  return T;
};
