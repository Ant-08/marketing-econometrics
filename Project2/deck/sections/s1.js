// Section 1 : slides 1 à 5 (Titre, Contexte et enjeu, Données et cible, La récence, Variables construites)
// Sources : results/01_summary.md, 01_key_numbers.json, 01_cleaning_decisions.csv, 01_taux_rachat_par_classe.csv,
//           02_summary.md, 02_feature_dictionary.csv, 06_summary.md (top 10 % = 16 042 clients).
const path = require('path');

module.exports = (T) => {
  const { pres, C, FONT, W, M, base, dark, card, chip, bullets, takeaway, img } = T;
  const FIG = path.join(__dirname, '..', 'figs');
  const R = pres.shapes;

  // Petit bloc « chiffre + légende » plus compact que T.stat
  const mini = (s, x, y, w, value, label, color = C.GREEN, size = 26) => {
    s.addText(value, { x, y, w, h: 0.5, fontFace: FONT.HEAD, fontSize: size, bold: true, color, margin: 0, valign: 'bottom', isTextBox: true });
    s.addText(label, { x, y: y + 0.52, w, h: 0.5, fontFace: FONT.BODY, fontSize: 12.5, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
  };
  const arrow = (s, x1, y1, x2, y2, color = C.GREEN) =>
    s.addShape(R.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width: 2.25, endArrowType: 'triangle' } });

  // =====================================================================
  // Slide 1 : titre
  // =====================================================================
  {
    const s = dark();
    s.addText('MARKETING ECONOMETRICS · TSE M2 · PROJET 2', { x: 0.9, y: 1.15, w: 11, h: 0.35, fontFace: FONT.BODY, fontSize: 13, bold: true, color: C.LEAF, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText('Qui va racheter le mois prochain ?', { x: 0.9, y: 1.7, w: 11.5, h: 1.2, fontFace: FONT.HEAD, fontSize: 48, bold: true, color: C.WHITE, margin: 0, valign: 'middle', isTextBox: true });
    s.addShape(R.RECTANGLE, { x: 0.9, y: 3.15, w: 1.3, h: 0.07, fill: { color: C.ORANGE }, line: { color: C.ORANGE } });
    s.addText('Prédire le rachat d’un client de supermarché en août 2020, et choisir qui contacter', { x: 0.9, y: 3.45, w: 10.5, h: 0.9, fontFace: FONT.BODY, fontSize: 22, color: C.MINT, margin: 0, valign: 'top', isTextBox: true });
    // trois repères discrets
    const marks = [['160 424', 'clients dans la base d’entraînement'], ['12 mois', 'd’historique, du 01/08/2019 au 31/07/2020'], ['1 mois', 'à prédire : août 2020']];
    marks.forEach(([v, l], i) => {
      const x = 0.9 + i * 3.9;
      s.addText(v, { x, y: 4.75, w: 3.6, h: 0.55, fontFace: FONT.HEAD, fontSize: 28, bold: true, color: C.WHITE, margin: 0, valign: 'bottom', isTextBox: true });
      s.addText(l, { x, y: 5.32, w: 3.6, h: 0.5, fontFace: FONT.BODY, fontSize: 13, color: C.LEAF, margin: 0, valign: 'top', isTextBox: true });
    });
    s.addShape(R.LINE, { x: 0.9, y: 6.35, w: W - 1.8, h: 0, line: { color: C.GREEN, width: 1 } });
    s.addText('Antoine Riollet · Mathis Sarguel · Nils', { x: 0.9, y: 6.5, w: 6, h: 0.4, fontFace: FONT.BODY, fontSize: 16, bold: true, color: C.WHITE, margin: 0, isTextBox: true });
    s.addText('Soutenance du 25/11/2026', { x: W - 0.9 - 5, y: 6.5, w: 5, h: 0.4, fontFace: FONT.BODY, fontSize: 16, color: C.MINT, align: 'right', margin: 0, isTextBox: true });
    s.addNotes('[0:00] Bonjour. Nous allons répondre à une question simple : parmi les clients d’un supermarché, qui va racheter le mois prochain ? ' +
      'Nous disposons de douze mois de tickets, du 1er août 2019 au 31 juillet 2020, pour 160 424 clients, et nous devons prédire qui rachètera en août 2020. ' +
      'Nous vous présentons d’abord les données et la récence, puis le modèle, puis un plan d’action sur un segment. [→ 0:15]');
  }

  // =====================================================================
  // Slide 2 : contexte et enjeu
  // =====================================================================
  {
    const s = base('Contexte et enjeu', 'Le marketing ne peut contacter que 10 % de la base : encore faut-il savoir lesquels', { source: 'Sources : results/01_key_numbers.json (160 424 clients, 7,72 %) ; results/06_summary.md (top 10 % = 16 042 clients).' });

    // --- gauche : le problème (grille 10 x 10)
    const gx = 0.6, gy = 1.75, cell = 0.27, step = 0.31;
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
      const hi = r === 0;
      s.addShape(R.ROUNDED_RECTANGLE, { x: gx + c * step, y: gy + r * step, w: cell, h: cell, rectRadius: 0.04, fill: { color: hi ? C.ORANGE : C.MINT }, line: { color: hi ? C.ORANGE : C.MINT } });
    }
    s.addText('Un e-mail promo pour la base entière coûte trop ; le marketing n’en enverra qu’à une fraction.', { x: 0.6, y: 5.1, w: 5.3, h: 0.9, fontFace: FONT.BODY, fontSize: 14, color: C.INK, margin: 0, valign: 'top', isTextBox: true });
    mini(s, 4.0, 1.75, 2.2, '10 %', 'de la base ciblables :', C.ORANGE, 34);
    mini(s, 4.0, 2.95, 2.2, '16 042', 'clients sur 160 424', C.GREEN, 30);
    mini(s, 4.0, 3.95, 2.2, '7,7 %', 'rachètent en août 2020 (12 392)', C.GREEN, 30);

    // --- droite : pont Projet 1 -> Projet 2
    const px = 6.9, pw = W - M - px;
    card(s, px, 1.65, pw, 1.5);
    s.addText('PROJET 1 · FEMINIZ (LINGERIE)', { x: px + 0.3, y: 1.77, w: pw - 0.6, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.MUTED, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText([{ text: 'Décrire ', options: { bold: true, color: C.SLATE } }, { text: 'la clientèle : RFM, segments, segment « Decel »', options: { color: C.INK } }],
      { x: px + 0.3, y: 2.12, w: pw - 0.6, h: 0.9, fontFace: FONT.BODY, fontSize: 17, margin: 0, valign: 'top', isTextBox: true });

    arrow(s, px + pw / 2, 3.2, px + pw / 2, 3.65);

    card(s, px, 3.7, pw, 1.5, C.MINT);
    s.addText('PROJET 2 · SUPERMARCHÉ', { x: px + 0.3, y: 3.82, w: pw - 0.6, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText([{ text: 'Prédire ', options: { bold: true, color: C.GREEN } }, { text: 'qui rachète en août 2020 : un score de propension par client, jugé à l’AUC', options: { color: C.INK } }],
      { x: px + 0.3, y: 4.17, w: pw - 0.6, h: 0.9, fontFace: FONT.BODY, fontSize: 17, margin: 0, valign: 'top', isTextBox: true });

    s.addText([{ text: 'Fil rouge : la récence. ', options: { bold: true, color: C.ORANGE } }, { text: 'Déjà au cœur de la RFM du Projet 1, c’est elle qui structure aussi la prédiction.', options: { color: C.INK } }],
      { x: px, y: 5.35, w: pw, h: 0.65, fontFace: FONT.BODY, fontSize: 14, margin: 0, valign: 'top', isTextBox: true });

    takeaway(s, 'Question : parmi 160 424 clients, lesquels contacter en août ? Un score, puis un plan d’action sur un segment.');
    s.addNotes('[0:15] Le contexte est celui d’une enseigne de supermarché. Le marketing prépare un e-mail promotionnel et ne peut cibler que 10 % de la base, soit 16 042 clients sur 160 424. ' +
      'En août 2020, seuls 7,7 % des clients rachètent : 12 392 personnes. Tirer les clients au hasard ne capterait donc que 10 % des racheteurs. ' +
      'Par rapport au Projet 1, Feminiz, où nous avions décrit la clientèle avec la RFM et le segment Decel, nous passons ici de la description à la prédiction : un score de propension, jugé par l’AUC. ' +
      'La récence, déjà centrale en RFM, sera notre fil rouge. Voyons d’abord les données. [→ 0:55]');
  }

  // =====================================================================
  // Slide 3 : données et construction de la cible
  // =====================================================================
  {
    const s = base('Données et cible', 'Douze mois de tickets pour prédire un seul mois : août 2020', { source: 'Sources : results/01_key_numbers.json ; results/01_train_vs_test.csv ; results/01_cleaning_decisions.csv (D02, D03, D14, D17) ; results/01_summary.md.' });

    // frise
    const y = 1.85, h = 0.62, x0 = 0.6, xr = 9.75, x1 = W - M;
    s.addShape(R.RECTANGLE, { x: x0, y, w: xr - x0, h, fill: { color: C.GREEN }, line: { color: C.GREEN } });
    s.addText('Historique observé : 3,29 M de tickets, 160 424 clients', { x: x0 + 0.2, y, w: xr - x0 - 0.3, h, fontFace: FONT.BODY, fontSize: 15, bold: true, color: C.WHITE, margin: 0, valign: 'middle', isTextBox: true });
    s.addShape(R.RECTANGLE, { x: xr + 0.12, y, w: x1 - xr - 0.12, h, fill: { color: C.ORANGE }, line: { color: C.ORANGE } });
    s.addText('Cible : achat en août 2020 ?', { x: xr + 0.2, y, w: x1 - xr - 0.28, h, fontFace: FONT.BODY, fontSize: 15, bold: true, color: C.WHITE, margin: 0, align: 'center', valign: 'middle', isTextBox: true });
    // repères de dates
    s.addShape(R.LINE, { x: xr + 0.06, y: y - 0.2, w: 0, h: h + 0.4, line: { color: C.INK, width: 1.5 } });
    s.addText('01/08/2019', { x: x0, y: y + h + 0.1, w: 2, h: 0.3, fontFace: FONT.BODY, fontSize: 13, color: C.MUTED, margin: 0, isTextBox: true });
    s.addText('31/07/2020', { x: xr - 1.7, y: y + h + 0.1, w: 1.7, h: 0.3, fontFace: FONT.BODY, fontSize: 13, color: C.MUTED, align: 'right', margin: 0, isTextBox: true });
    s.addText('01/08/2020 : date de référence', { x: xr - 3.6, y: y - 0.52, w: 3.6, h: 0.3, fontFace: FONT.BODY, fontSize: 13, bold: true, color: C.INK, align: 'right', margin: 0, isTextBox: true });
    s.addText('01/08 → 31/08/2020', { x: xr + 0.12, y: y + h + 0.1, w: x1 - xr - 0.12, h: 0.3, fontFace: FONT.BODY, fontSize: 13, color: C.MUTED, align: 'center', margin: 0, isTextBox: true });

    // trois colonnes
    const cy = 3.3, ch = 2.75, cw = 3.9, gap = 0.215;
    const cx = (i) => M + i * (cw + gap);
    const head = (i, t) => s.addText(t.toUpperCase(), { x: cx(i) + 0.25, y: cy + 0.15, w: cw - 0.5, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.GREEN, charSpacing: 2, margin: 0, isTextBox: true });

    card(s, cx(0), cy, cw, ch); head(0, 'Train et test');
    mini(s, cx(0) + 0.25, cy + 0.5, cw - 0.5, '160 424 clients', 'train : 7,72 % de racheteurs (12 392)', C.GREEN, 24);
    mini(s, cx(0) + 0.25, cy + 1.6, cw - 0.5, '40 106 clients', 'test, cible masquée (Kaggle) ; comparable au train', C.SLATE, 24);

    card(s, cx(1), cy, cw, ch); head(1, 'Une cible rare');
    bullets(s, [
      [{ text: '92 % des clients ne rachètent pas', bold: true }, { text: ' en août : le classement compte plus que la valeur des probabilités' }],
      [{ text: 'Aucun ticket d’août 2020', bold: true }, { text: ' dans les fichiers : pas de fuite directe' }],
      [{ text: 'Août n’est pas un mois creux ', bold: true }, { text: ': 2e mois le plus actif de l’historique' }],
    ], cx(1) + 0.25, cy + 0.55, cw - 0.5, ch - 0.7, 14);

    card(s, cx(2), cy, cw, ch); head(2, 'Nettoyages marquants');
    bullets(s, [
      [{ text: 'Paiements fractionnés ', bold: true }, { text: ': 5 742 lignes fusionnées en tickets' }],
      [{ text: 'Retours ', bold: true }, { text: '(0,21 % des tickets) : hors récence et fréquence' }],
      [{ text: 'Extrêmes plafonnés ', bold: true }, { text: 'au P99,9 ; manquants gardés en modalité « inconnu »' }],
    ], cx(2) + 0.25, cy + 0.55, cw - 0.5, ch - 0.7, 14);

    takeaway(s, 'Une cible rare (7,7 %) : ce qu’on cherche, c’est un bon classement des clients.');
    s.addNotes('[0:55] Voici le dispositif. Nous observons chaque client du 1er août 2019 au 31 juillet 2020, soit 3,29 millions de tickets, et nous prédisons s’il achète en août 2020. ' +
      'Le train compte 160 424 clients, dont 7,72 % de racheteurs, soit 12 392 ; le test compte 40 106 clients dont la cible est masquée, et il ressemble au train. ' +
      'Aucun ticket d’août n’est dans les fichiers, donc pas de fuite directe. Comme la cible est rare, seul le classement des clients compte, pas la valeur exacte des probabilités. ' +
      'Côté nettoyage, trois décisions : fusionner les 5 742 lignes de paiements fractionnés en tickets, traiter les retours à part pour qu’ils ne rajeunissent pas la récence, et plafonner les extrêmes sans supprimer de clients. [→ 1:45]');
  }

  // =====================================================================
  // Slide 4 : la récence
  // =====================================================================
  {
    const s = base('Ce que disent les données', 'Plus le dernier achat est récent, plus le rachat est probable', { source: 'Sources : results/01_taux_rachat_par_classe.csv ; results/01_summary.md (récence = jours révolus entre le dernier ticket d’achat et le 01/08/2020) ; results/02_summary.md (AUC).' });
    img(s, path.join(FIG, 's1_recence_rachat.png'), 0.6, 1.5, 8.1, 4.62);

    const px = 9.1, pw = W - M - px;
    mini(s, px, 1.6, pw, '22,5 % → 0,5 %', 'taux de rachat d’un client venu il y a 7 jours ou moins, contre plus de 180 jours (rapport de 48)', C.ORANGE, 26);
    mini(s, px, 3.15, pw, 'AUC 0,818', 'de la règle « plus récent = plus probable », sans aucun modèle', C.GREEN, 28);
    mini(s, px, 4.7, pw, 'Top 10 % : 23,5 %', 'de précision, 30,4 % de rappel (lift 3,0)', C.GREEN, 24);

    takeaway(s, 'La récence est la référence : le modèle devra faire nettement mieux que 0,818 d’AUC.');
    s.addNotes('[1:45] Premier résultat, et c’est le fil rouge de l’exposé : plus le dernier achat est récent, plus le client rachète. ' +
      'Un client venu dans les 7 derniers jours rachète à 22,5 % ; au-delà de 180 jours, 0,5 %, soit un rapport de 48. Un quart des clients, 25 %, n’est pas venu depuis plus de six mois. ' +
      'Cette règle sans modèle donne déjà une AUC de 0,818 ; en ciblant les 10 % les plus récents, la précision est de 23,5 % et le rappel de 30,4 %, pour un lift de 3. ' +
      'C’est donc notre référence : le modèle devra faire mieux. Voyons les variables que nous construisons pour cela. [→ 2:35]');
  }

  // =====================================================================
  // Slide 5 : variables construites et garde-fou
  // =====================================================================
  {
    const s = base('Variables construites', 'Une centaine de variables en six familles, toutes calculées avant le 1er août 2020', { source: 'Sources : results/02_feature_dictionary.csv (100 variables retenues) ; results/02_summary.md (68 % du gain du modèle de contrôle ; règles anti-fuite).' });

    const fam = [
      ['Récence et fréquence', 19, 'Jours depuis le dernier achat ; tickets sur 7, 30, 60, 90, 180 jours', true],
      ['Montant', 15, 'Dépenses sur 30 à 180 jours, panier moyen, articles par ticket', false],
      ['Rythme et tendance', 20, 'Écart habituel entre deux achats, retard sur ce rythme, tendance sur 90 jours', false],
      ['Saisonnalité et calendrier', 10, 'Achat en août 2019 ; part des achats le week-end, le soir, au confinement', false],
      ['Promotions et retours', 10, 'Taux de remise, part de tickets remisés, retours', false],
      ['Profil et contexte', 26, 'E-mail, carte de fidélité, département, magasins, paiement, segment de prix', false],
    ];
    const gx = M, gy = 1.6, cw = 2.72, ch = 2.1, gp = 0.17;
    fam.forEach(([name, n, ex, hi], i) => {
      const x = gx + (i % 3) * (cw + gp), y = gy + Math.floor(i / 3) * (ch + 0.18);
      card(s, x, y, cw, ch, hi ? C.MINT : C.TINT);
      if (hi) s.addShape(R.RECTANGLE, { x, y: y + 0.15, w: 0.07, h: ch - 0.3, fill: { color: C.ORANGE }, line: { color: C.ORANGE } });
      s.addText([{ text: String(n), options: { fontFace: FONT.HEAD, fontSize: 28, bold: true, color: hi ? C.ORANGE : C.GREEN } }, { text: '  variables', options: { fontFace: FONT.BODY, fontSize: 12, color: C.MUTED } }],
        { x: x + 0.22, y: y + 0.12, w: cw - 0.4, h: 0.55, margin: 0, valign: 'middle', isTextBox: true });
      s.addText(name, { x: x + 0.22, y: y + 0.72, w: cw - 0.4, h: 0.35, fontFace: FONT.BODY, fontSize: 15, bold: true, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
      s.addText(ex, { x: x + 0.22, y: y + 1.1, w: cw - 0.4, h: 0.9, fontFace: FONT.BODY, fontSize: 12, color: C.INK, margin: 0, valign: 'top', isTextBox: true });
    });

    // garde-fou
    const px = 9.4, pw = W - M - px, py = 1.6, ph = 2 * 2.1 + 0.18;
    s.addShape(R.ROUNDED_RECTANGLE, { x: px, y: py, w: pw, h: ph, fill: { color: C.DEEP }, line: { color: C.DEEP }, rectRadius: 0.08 });
    s.addText('GARDE-FOU ANTI-FUITE', { x: px + 0.3, y: py + 0.2, w: pw - 0.6, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.LEAF, charSpacing: 2, margin: 0, isTextBox: true });
    bullets(s, [
      [{ text: 'Seuls les tickets avant le 01/08/2020 ', bold: true }, { text: 'servent à calculer une variable' }],
      [{ text: 'La cible ne sert jamais ', bold: true }, { text: 'à fabriquer une variable' }],
      [{ text: 'Plafonds et regroupements appris sur le train', bold: true }, { text: ', puis appliqués au test' }],
      [{ text: 'Même code ', bold: true }, { text: 'pour construire les variables du train et du test' }],
    ], px + 0.3, py + 0.7, pw - 0.6, ph - 0.9, 15, C.WHITE);

    takeaway(s, 'Récence et fréquence portent l’essentiel du signal ; les autres familles affinent.');
    s.addNotes('[2:35] Nous avons construit 100 variables, regroupées en six familles : récence et fréquence, 19 variables ; montant, 15 ; rythme et tendance, 20 ; saisonnalité et calendrier, 10 ; promotions et retours, 10 ; et profil et contexte, 26. ' +
      'Un modèle de contrôle non réglé s’appuie pour 68 % de son gain sur la récence et la fréquence : le reste affine. ' +
      'Le garde-fou principal est l’absence de fuite temporelle : toutes les variables sont calculées uniquement avec les tickets d’avant le 1er août 2020, la cible ne sert jamais à les fabriquer, et plafonds et regroupements sont appris sur le train puis appliqués au test. ' +
      'Un point de vigilance, que nous reprendrons : la famille calendrier contient la part d’achats le week-end, et août 2020 commence un samedi. ' +
      'Passons à la modélisation, du plus simple au plus riche. [→ 3:30]');
  }
};
