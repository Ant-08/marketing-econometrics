// Annexes : intercalaire sombre + 8 slides techniques (réserve pour les questions du jury).
// Chaque chiffre vient de results/ (source citée en bas de slide). Aucun score Kaggle.
const fs = require('fs');
const path = require('path');

const RES = path.join(__dirname, '..', '..', 'results');

// ---- lecture CSV (guillemets, virgules et guillemets doublés gérés)
function parseCSV(file) {
  const txt = fs.readFileSync(path.join(RES, file), 'utf8').replace(/^﻿/, '');
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) {
      if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const head = rows.shift();
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const readJSON = f => JSON.parse(fs.readFileSync(path.join(RES, f), 'utf8'));

// ---- formats français
const nf = (v, d = 2) => Number(v).toFixed(d).replace('.', ',');
const pf = (v, d = 1) => nf(v, d) + ' %';              // v déjà en %
const thou = v => Math.round(Number(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const MINUS = '−';

module.exports = (T) => {
  const { pres, C, FONT, W, M, base, dark, card, chip, bullets, takeaway } = T;
  const R = pres.shapes;

  // ---- brique locale : tableau épuré (filets fins, en-tête vert)
  function tbl(s, header, rows, o) {
    const fs_ = o.fs || 12;
    const al = o.align || header.map((_, i) => (i === 0 ? 'left' : 'center'));
    const line = (color, pt) => ({ type: 'solid', color, pt });
    const none = { type: 'none' };
    const mk = (txt, i, extra = {}) => ({
      text: String(txt),
      options: Object.assign({ fontFace: FONT.BODY, fontSize: fs_, color: C.INK, align: al[i], valign: 'middle', margin: [0, 0.08, 0, 0.08] }, extra),
    });
    const data = [header.map((h, i) => mk(h, i, { bold: true, color: C.GREEN, fontSize: o.hfs || fs_, border: [none, none, line(C.GREEN, 1.25), none] }))];
    rows.forEach((r, ri) => {
      const hi = o.hiRows && o.hiRows.includes(ri);
      data.push(r.map((c, i) => {
        const cell = (typeof c === 'object' && c !== null) ? c : { t: c };
        const ex = { border: [none, none, line(C.MINT, 0.75), none] };
        if (hi) { ex.fill = { color: C.MINT }; ex.bold = true; }
        if (i === 0 && !hi && o.firstBold !== false) ex.bold = true;
        if (cell.color) ex.color = cell.color;
        if (cell.bold !== undefined) ex.bold = cell.bold;
        if (cell.fill) ex.fill = { color: cell.fill };
        return mk(cell.t, i, ex);
      }));
    });
    s.addTable(data, { x: o.x, y: o.y, w: o.w, colW: o.colW, rowH: [o.hRowH || 0.42].concat(rows.map(() => o.rowH)), autoPage: false });
  }

  // =====================================================================
  // Intercalaire
  // =====================================================================
  {
    const s = dark();
    s.addShape(R.RECTANGLE, { x: M, y: 2.35, w: 0.9, h: 0.07, fill: { color: C.ORANGE }, line: { color: C.ORANGE } });
    s.addText('RÉSERVE POUR LES QUESTIONS', { x: M, y: 1.85, w: 8, h: 0.35, fontFace: FONT.BODY, fontSize: 12, bold: true, color: C.MINT, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText('Annexes', { x: M, y: 2.6, w: 8, h: 1.1, fontFace: FONT.HEAD, fontSize: 54, bold: true, color: C.WHITE, margin: 0, valign: 'top', isTextBox: true });
    s.addText('Détails techniques hors présentation : variables, modèles, validation, nettoyage, segmentation, hypothèses économiques.', { x: M, y: 3.85, w: 6.3, h: 1.0, fontFace: FONT.BODY, fontSize: 16, color: C.MINT, margin: 0, valign: 'top', isTextBox: true });
    const items = [
      ['A1', 'Dictionnaire des variables'], ['A2', 'Comparaison complète des modèles'], ['A3', 'Protocole de validation et LightGBM final'],
      ['A4', 'Décisions de nettoyage des données'], ['A5', 'Ablation par famille et permutation'], ['A6', 'Segments RFM et six classes'],
      ['A7', 'Hypothèses économiques et test A/B'], ['A8', 'Régression logistique : odds ratios'],
    ];
    items.forEach(([k, t], i) => {
      const y = 1.85 + i * 0.58;
      s.addText(k, { x: 8.2, y, w: 0.7, h: 0.4, fontFace: FONT.HEAD, fontSize: 18, bold: true, color: C.ORANGE, margin: 0, valign: 'middle', isTextBox: true });
      s.addText(t, { x: 8.95, y, w: 3.9, h: 0.4, fontFace: FONT.BODY, fontSize: 15, color: C.WHITE, margin: 0, valign: 'middle', isTextBox: true });
    });
    s.addNotes('Annexes, hors temps de présentation : elles servent de réserve pour les questions du jury (variables, modèles, validation, nettoyage, segmentation, hypothèses).');
  }

  // =====================================================================
  // A1 : dictionnaire des variables
  // =====================================================================
  {
    const s = base('Annexe · A1 · Dictionnaire des variables',
      '81 variables construites en dix familles, avec les seuls tickets antérieurs au 1er août 2020',
      { source: 'Source : results/02_feature_dictionary.csv, 02_summary.md. 129 variables candidates, 100 colonnes retenues (81 variables + 19 jumeaux log pour les modèles linéaires).' });
    const rows = [
      ['Récence', 4, 'recency_days, recency_prev_days, last_interval_days', 'Jours depuis le dernier et l\'avant-dernier achat, ancienneté observée'],
      ['Fréquence', 9, 'n_tickets_14 / 30 / 60 / 180, active_weeks_share', 'Nombre de tickets par fenêtre glissante, régularité de présence'],
      ['Montant', 11, 'spend_90, basket_mean_30, items_per_ticket_mean', 'Dépense, panier moyen, articles par ticket, prix moyen par article'],
      ['Rythme et tendance', 15, 'interval_mean_days, delay_ratio_mean, trend_freq_90', 'Écart habituel entre achats, retard relatif, tendance récente'],
      ['Saisonnalité', 9, 'share_weekend, share_saturday, bought_same_month_ly', 'Jour et heure d\'achat, été, Noël, confinement, achat en août 2019'],
      ['Promotions et retours', 8, 'discount_rate_all, share_tickets_disc, n_returns', 'Taux de remise, part de tickets remisés, retours'],
      ['Paiement', 6, 'share_pay_card, share_pay_cash, share_pay_none', 'Parts des modes de paiement par client'],
      ['Segment de prix', 2, 'price_segment, price_segment_missing', 'Positionnement prix déclaré (Access, Mixte, Quali), souvent absent'],
      ['Magasins', 6, 'n_stores, n_regions, last_store_is_main', 'Nombre de magasins et de régions, fidélité au magasin principal'],
      ['Profil client', 11, 'has_email, has_card, dept, civility', 'E-mail, carte de fidélité, département, civilité'],
    ].map(r => [r[0], { t: String(r[1]) }, { t: r[2], color: C.MUTED }, r[3]]);
    tbl(s, ['Famille', 'Variables', 'Exemples (noms dans les données)', 'Ce qu\'elles mesurent'], rows,
      { x: M, y: 1.5, w: W - 2 * M, colW: [2.35, 1.0, 4.45, 4.33], rowH: 0.47, fs: 12, align: ['left', 'center', 'left', 'left'] });
    s.addNotes('Dix familles, 81 variables de base, toutes calculées avec les seuls tickets antérieurs au 1er août 2020 : aucune fuite de la cible. Les jumeaux log ne servent qu\'aux modèles linéaires.');
  }

  // =====================================================================
  // A2 : comparaison complète des modèles
  // =====================================================================
  {
    const s = base('Annexe · A2 · Comparaison des modèles',
      'Le LightGBM réglé arrive en tête, mais son avance sur XGBoost est dans le bruit des plis',
      { source: 'Source : results/03_model_comparison.csv, 04_model_comparison.csv, 04_desequilibre.csv. Scores hors-échantillon, mêmes 5 plis ; top 10 % = 16 042 clients.' });
    const cmp = Object.assign({}, ...[...parseCSV('03_model_comparison.csv'), ...parseCSV('04_model_comparison.csv')].map(r => ({ [r.model]: r })));
    const spec = [
      ['recency_rule', 'Règle : récence seule (repère)'], ['rfm_score', 'Règle : score RFM du cours'], ['nb', 'Naive Bayes (8 variables)'],
      ['knn', 'k plus proches voisins (k = 800)'], ['tree', 'Arbre de décision (profondeur 5)'], ['logreg', 'Régression logistique'],
      ['logreg_lasso', 'Logistique pénalisée Lasso'], ['rf_default', 'Forêt aléatoire, non réglée'], ['rf_tuned', 'Forêt aléatoire réglée'],
      ['xgb_default', 'XGBoost, non réglé'], ['xgb_tuned', 'XGBoost réglé'], ['lgbm_default', 'LightGBM, non réglé'], ['lgbm_tuned', 'LightGBM réglé (modèle final)'],
    ];
    const rows = spec.map(([k, lab]) => {
      const r = cmp[k];
      return [lab, nf(r.auc, 4), nf(r.auc_fold_std, 4), r.logloss === '' || r.logloss === undefined ? '–' : nf(r.logloss, 3), nf(r.lift_top10, 2)];
    });
    tbl(s, ['Modèle', 'AUC', 'Écart-type entre plis', 'Log-loss', 'Lift top 10 %'], rows,
      { x: M, y: 1.5, w: 8.2, colW: [3.6, 1.0, 1.5, 1.0, 1.1], rowH: 0.355, fs: 12, hiRows: [spec.length - 1] });
    // panneau de lecture
    const px = 9.15, pw = W - M - px;
    card(s, px, 1.5, pw, 4.95);
    s.addText('À savoir', { x: px + 0.25, y: 1.62, w: pw - 0.5, h: 0.35, fontFace: FONT.HEAD, fontSize: 15, bold: true, color: C.GREEN, margin: 0, isTextBox: true });
    bullets(s, [
      [{ text: 'Réglage : ', bold: true }, { text: 'il rapporte surtout aux forêts et à XGBoost (+0,012 à +0,013 d\'AUC).' }],
      [{ text: 'LightGBM contre XGBoost : ', bold: true }, { text: '+0,0006 d\'AUC, très inférieur à l\'écart-type entre plis (0,0022).' }],
      [{ text: 'Rachats pondérés : ', bold: true }, { text: 'AUC 0,8776 mais log-loss 0,418 contre 0,190 ; classement identique, probabilités faussées. Non retenu.' }],
      [{ text: 'Log-loss : ', bold: true }, { text: 'sans objet pour les règles (ce ne sont pas des probabilités).' }],
    ], px + 0.25, 2.05, pw - 0.5, 4.3, 12.5);
    s.addNotes('Treize modèles, tous évalués sur les mêmes cinq plis. Le LightGBM réglé a la meilleure AUC, mais la différence avec XGBoost réglé est dans le bruit : nous le retenons pour sa vitesse et ses valeurs SHAP exactes.');
  }

  // =====================================================================
  // A3 : protocole de validation + hyperparamètres
  // =====================================================================
  {
    const s = base('Annexe · A3 · Protocole de validation',
      'Chaque client est noté par un modèle qui ne l\'a jamais vu : 5 plis stratifiés, graine 42',
      { source: 'Source : results/04_best_params.json, 06_best_model.json, 01_rachat_par_pli.csv ; common.py (get_folds).' });
    const steps = [
      ['1', '5 plis stratifiés, graine 42', 'Même découpage pour tous les modèles : 32 085 clients et 7,72 % de racheteurs dans chaque pli.'],
      ['2', 'Scores hors-échantillon', 'Un client est noté par le modèle entraîné sans lui ; toutes les métriques utilisent ces scores.'],
      ['3', 'Prédiction du test = moyenne des 5 modèles', 'Pas de ré-ajustement ; le test ne sert à aucune décision.'],
      ['4', 'Réglage sur 40 000 clients', 'Recherche aléatoire (30 configurations) puis grille fine, 3 plis internes ; nombre d\'arbres par arrêt anticipé sur le pli 0.'],
    ];
    steps.forEach(([n, t, d], i) => {
      const y = 1.55 + i * 1.07;
      chip(s, M, y + 0.05, n, C.GREEN, C.WHITE, 0.5);
      s.addText(t, { x: M + 0.7, y, w: 5.3, h: 0.32, fontFace: FONT.BODY, fontSize: 14, bold: true, color: C.INK, margin: 0, valign: 'top', isTextBox: true });
      s.addText(d, { x: M + 0.7, y: y + 0.34, w: 5.3, h: 0.66, fontFace: FONT.BODY, fontSize: 12, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
    });
    // hyperparamètres
    const hp = readJSON('06_best_model.json').hyperparametres;
    const rows = [
      ['num_leaves', hp.num_leaves, 'Feuilles par arbre'],
      ['min_child_samples', hp.min_child_samples, 'Clients minimum par feuille'],
      ['subsample', nf(hp.subsample, 1), 'Part des clients par arbre'],
      ['colsample_bytree', nf(hp.colsample_bytree, 1), 'Part des variables par arbre'],
      ['reg_lambda', nf(hp.reg_lambda, 0), 'Pénalité L2 sur les feuilles'],
      ['reg_alpha', nf(hp.reg_alpha, 1), 'Pénalité L1 sur les feuilles'],
      ['learning_rate', nf(hp.learning_rate, 2), 'Pas d\'apprentissage'],
      ['n_estimators', hp.n_estimators, 'Arbres (arrêt anticipé)'],
    ].map(r => [r[0], { t: String(r[1]), bold: true, color: C.GREEN }, { t: r[2], color: C.MUTED }]);
    s.addText('LightGBM final : hyperparamètres', { x: 7.1, y: 1.5, w: 5.6, h: 0.35, fontFace: FONT.HEAD, fontSize: 15, bold: true, color: C.INK, margin: 0, isTextBox: true });
    tbl(s, ['Paramètre', 'Valeur', 'Rôle'], rows, { x: 7.1, y: 1.95, w: 5.63, colW: [1.95, 1.45, 2.23], rowH: 0.4, fs: 12, align: ['left', 'center', 'left'] });
    s.addText('170 colonnes après encodage one-hot ; données manquantes gérées nativement.', { x: 7.1, y: 5.65, w: 5.63, h: 0.3, fontFace: FONT.BODY, fontSize: 11, color: C.MUTED, margin: 0, isTextBox: true });
    takeaway(s, 'AUC légèrement optimiste : réglage et évaluation partagent les mêmes plis (IC 95 % bootstrap : 0,876 à 0,882).');
    s.addNotes('Les cinq plis sont fixés une fois pour toutes et stratifiés sur la cible. Le réglage utilise les mêmes plis que l\'évaluation, donc l\'AUC est un peu optimiste ; nous le disons plutôt que de le cacher.');
  }

  // =====================================================================
  // A4 : décisions de nettoyage
  // =====================================================================
  {
    const s = base('Annexe · A4 · Nettoyage des données',
      'Vingt anomalies traitées, aucun client supprimé : les huit décisions qui pèsent le plus',
      { source: 'Source : results/01_cleaning_decisions.csv (D01, D02, D03, D06, D13, D17, D18, D20), 01_key_numbers.json.' });
    const rows = [
      ['Cible', 'Rachat de 7,7 %, très inférieur à l\'activité mensuelle historique', 'Cible conservée telle que fournie ; on lit le classement, pas la probabilité', 'Reconduction mensuelle historique 62 à 80 %, juillet vers août 2020 : 16 %'],
      ['Tickets', 'Plusieurs lignes pour un même client et un même instant', 'Agrégées en un ticket : ce sont des paiements fractionnés, pas des doublons', '3 298 736 lignes devenues 3 292 994 tickets'],
      ['Retours', 'Tickets de retour ou d\'avoir (panier ≤ 0)', 'Drapeau conservé ; récence, fréquence et panier calculés hors retours', '6 854 tickets (0,21 %), 3 625 clients'],
      ['Codes postaux', 'Codes à 4 chiffres : codes étrangers, pas un zéro perdu', 'Département « ETR » ; aucun zéro rajouté', '554 clients concernés'],
      ['Segment de prix', 'Absent pour 56,7 % des clients, de façon non aléatoire', 'Modalité « Manquant » ; ni imputation ni suppression', 'Rachat 6,3 % (manquant) contre 9,6 % (renseigné)'],
      ['Tickets extrêmes', 'Queue très longue : panier jusqu\'à 20 227 €', 'Conservés, plafonnés au 99,9e percentile (469 €) avant agrégation', '3 287 tickets (0,1 %)'],
      ['Clients très actifs', 'Jusqu\'à 2 985 tickets sur l\'année', 'Conservés (vrais clients, rachat 69 %) ; comptes plafonnés au 99,9e percentile', '158 clients plafonnés (0,1 %)'],
      ['Calendrier', 'Un seul mois cible, un seul mois d\'août observé', 'Aucune variable de mois ; fenêtres récentes ; jour et heure comme habitudes', 'Avril 2020 : ' + MINUS + '32 % de tickets (confinement)'],
    ].map(r => [r[0], r[1], r[2], { t: r[3], color: C.GREEN, bold: true }]);
    tbl(s, ['Sujet', 'Anomalie constatée', 'Décision', 'Ampleur'], rows,
      { x: M, y: 1.5, w: W - 2 * M, colW: [1.65, 3.6, 4.1, 2.78], rowH: 0.6, fs: 12, align: ['left', 'left', 'left', 'left'] });
    s.addNotes('Vingt décisions de nettoyage au total ; ici les huit qui comptent pour la lecture des résultats. Principe constant : on documente et on garde l\'information plutôt que d\'imputer ou de supprimer.');
  }

  // =====================================================================
  // A5 : ablation par famille + importance par permutation
  // =====================================================================
  {
    const s = base('Annexe · A5 · Ablation et importance',
      'Une seule famille pèse dans l\'ablation, la saisonnalité, et surtout la part d\'achats le week-end',
      { source: 'Source : results/04_ablation_familles.csv (LightGBM rapide, référence AUC ≈ 0,8772), 04_importance_variables.csv, 06_diagnostic_calendrier.json.' });
    // -- gauche : ablation (barres dessinées)
    const abl = parseCSV('04_ablation_familles.csv').map(r => ({ lab: r.retrait, v: -Number(r.perte_auc) * 1e4 }))
      .sort((a, b) => b.v - a.v);
    const short = { 'Parts de week-end et de samedi (2 variables)': 'dont week-end et samedi (2 var.)', 'Profil d\'identité (e-mail, département, civilité)': 'Profil d\'identité (e-mail, dépt, civilité)' };
    s.addText('Ablation : AUC perdue si on retire la famille', { x: M, y: 1.5, w: 6.4, h: 0.3, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    s.addText('points d\'AUC sur 10 000 (négatif : l\'AUC remonte sans la famille)', { x: M, y: 1.8, w: 6.4, h: 0.26, fontFace: FONT.BODY, fontSize: 11, color: C.MUTED, margin: 0, isTextBox: true });
    const y0 = 2.15, rh = 0.325, lx = M, lw = 3.15, bx = 3.9, bw = 2.5, vmax = 70;
    abl.forEach((r, i) => {
      const y = y0 + i * rh;
      const lab = short[r.lab] || r.lab;
      const sub = r.lab.startsWith('Parts de week-end');
      s.addText(lab, { x: lx + (sub ? 0.2 : 0), y, w: lw - (sub ? 0.2 : 0), h: rh, fontFace: FONT.BODY, fontSize: 12, color: sub ? C.MUTED : C.INK, italic: sub, margin: 0, valign: 'middle', isTextBox: true });
      const len = Math.max(0.02, Math.max(0, r.v) / vmax * bw);
      const col = sub ? C.ORANGE : (r.v > 20 ? C.GREEN : C.GREY);
      s.addShape(R.RECTANGLE, { x: bx, y: y + 0.07, w: len, h: rh - 0.14, fill: { color: col }, line: { color: col } });
      const val = (r.v < -0.5 ? MINUS + Math.abs(Math.round(r.v)) : Math.round(r.v) <= 0 ? '0' : String(Math.round(r.v)));
      s.addText(val, { x: bx + len + 0.08, y, w: 0.6, h: rh, fontFace: FONT.BODY, fontSize: 12, bold: true, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    });
    // -- droite : permutation vs gain
    const imp = parseCSV('04_importance_variables.csv');
    const lab = {
      share_weekend: 'Part d\'achats le week-end', recency_days: 'Jours depuis le dernier achat', n_tickets_60: 'Tickets sur 60 jours',
      delay_ratio_mean: 'Retard sur le rythme habituel', recency_prev_days: 'Jours depuis l\'avant-dernier achat', share_summer_months: 'Part d\'achats juillet-août',
      n_tickets_180: 'Tickets sur 180 jours', share_saturday: 'Part d\'achats le samedi',
    };
    const top = imp.map(r => ({ k: r[''], perm: Number(r.perm_baisse_auc) * 1e4, gain: Number(r.gain_lgbm) * 100 })).sort((a, b) => b.perm - a.perm).slice(0, 8);
    s.addText('Deux mesures d\'importance, deux classements', { x: 7.35, y: 1.5, w: 5.4, h: 0.3, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    const rows = top.map(r => [lab[r.k] || r.k, { t: String(Math.round(r.perm)), bold: true, color: r.k === 'share_weekend' ? C.ORANGE : C.GREEN }, nf(r.gain, 1)]);
    tbl(s, ['Variable', 'Permutation (pts sur 10 000)', 'Part du gain LightGBM (%)'], rows,
      { x: 7.35, y: 1.9, w: 5.38, colW: [2.58, 1.4, 1.4], rowH: 0.43, fs: 12, hfs: 11, align: ['left', 'center', 'center'] });
    const diag = readJSON('06_diagnostic_calendrier.json');
    takeaway(s, 'Le gain met la fréquence en tête, la permutation la part de week-end : à tester sur d\'autres mois (effet de calendrier possible).');
    s.addNotes('Retirer la saisonnalité coûte 64 points d\'AUC sur 10 000, les neuf autres familles presque rien : elles se recouvrent. Le poids de la part de week-end est notre point de vigilance, car août 2020 commence un samedi.');
    void diag;
  }

  // =====================================================================
  // A6 : segments RFM + six classes
  // =====================================================================
  {
    const s = base('Annexe · A6 · Segmentation',
      'Sept segments RFM à seuils métier, six classes de comportement qui découpent un continuum',
      { source: 'Source : results/05_segment_definitions.json, 05_segment_profiles.csv, 05_cluster_profiles.csv, 05_summary.md. Base d\'apprentissage (160 424 clients) ; rachat = achat en août 2020.' });
    const def = readJSON('05_segment_definitions.json'), th = def.thresholds_business;
    // bandeau des règles
    card(s, M, 1.5, W - 2 * M, 0.95);
    s.addText([
      { text: 'Ordre d\'application : ', options: { bold: true, color: C.GREEN } },
      { text: `Inactive (plus de 180 j sans achat) puis New (1er ticket il y a moins de 90 j), puis notation sur trois seuils.`, options: { breakLine: true } },
      { text: 'Récence : ', options: { bold: true, color: C.GREEN } },
      { text: `${th.R.high_max_days} j, ${th.R.medium_max_days} j   `, options: {} },
      { text: 'Fréquence (tickets sur 12 mois) : ', options: { bold: true, color: C.GREEN } },
      { text: `${th.F.low_max}, ${th.F.medium_max}   `, options: {} },
      { text: 'Montant (12 mois) : ', options: { bold: true, color: C.GREEN } },
      { text: `${th.M.low_max} €, ${th.M.medium_max} €`.replace('1000', '1 000'), options: {} },
    ], { x: M + 0.25, y: 1.5, w: W - 2 * M - 0.5, h: 0.95, fontFace: FONT.BODY, fontSize: 13, color: C.INK, valign: 'middle', margin: 0, isTextBox: true });
    // segments RFM
    const prof = parseCSV('05_segment_profiles.csv');
    const order = ['Top', 'Good', 'Decel', 'Small', 'Weak', 'New', 'Inactive'];
    const seg = order.map(n => prof.find(r => r.segment === n));
    const rowsL = seg.map(r => [r.segment, thou(r.n_clients) + ' (' + Math.round(r.pct_clients) + ' %)', Math.round(r.pct_ca) + ' %', pf(r.rebuy_pct, 1), nf(r.lift, 2)]);
    s.addText('Segments RFM', { x: M, y: 2.6, w: 6, h: 0.3, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    tbl(s, ['Segment', 'Clients', 'Part du CA', 'Rachat', 'Lift'], rowsL,
      { x: M, y: 2.95, w: 6.0, colW: [1.3, 1.75, 1.05, 1.0, 0.9], rowH: 0.37, fs: 12, hiRows: [1] });
    // classes
    const cl = parseCSV('05_cluster_profiles.csv');
    const rowsR = cl.map(r => [r.segment.replace(/^C\d /, 'C' + r.segment[1] + ' · '), Math.round(r.pct_clients) + ' %', nf(r.basket_mean, 0) + ' €', nf(r.recency_median, 0) + ' j', pf(r.rebuy_pct, 1)]);
    s.addText('Six classes (K-Means sur 9 variables, après ACP)', { x: 6.95, y: 2.6, w: 5.8, h: 0.3, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    tbl(s, ['Classe', 'Clients', 'Panier moyen', 'Récence (méd.)', 'Rachat'], rowsR,
      { x: 6.95, y: 2.95, w: 5.78, colW: [1.95, 0.85, 1.05, 1.1, 0.83], rowH: 0.37, fs: 12, hfs: 11 });
    takeaway(s, 'Silhouette 0,17 : les classes découpent un continuum (k = 6 choisi pour l\'interprétation). Elles décrivent, elles ne prouvent aucun effet.');
    s.addNotes('Les seuils métier sont lisibles et stables ; les tertiles du train donnent les mêmes étiquettes pour 81 % des clients. Good est le segment retenu pour le plan d\'action : 24 203 clients, rachat 6,5 %.');
  }

  // =====================================================================
  // A7 : hypothèses économiques + dimensionnement A/B
  // =====================================================================
  {
    const s = base('Annexe · A7 · Hypothèses et test A/B',
      'Les euros restent des hypothèses ; le test A/B sur Good ne détecte qu\'un effet d\'au moins 1,2 point',
      { source: 'Source : results/07_hypotheses.json, 07_ab_dimensionnement.csv, 07_ab_mde.csv, 07_summary.md. Témoin 30 %, risque 5 %, puissance 80 % ; effectif Good : 17 486 clients e-mailables.' });
    const hy = readJSON('07_hypotheses.json'), sup = hy['SUPPOSE (hypothèses)'], mes = hy['MESURE (données)'];
    // gauche : mesuré / supposé
    const lx = M, lw = 5.1;
    card(s, lx, 1.5, lw, 1.15);
    chip(s, lx + 0.2, 1.62, 'Mesuré', C.GREEN, C.WHITE, 1.1);
    s.addText(`Taux de rachat de la base : ${pf(mes.taux_rachat_base * 100, 2)}. Scores hors-échantillon du LightGBM réglé, effectifs train + test.`, { x: lx + 1.45, y: 1.5, w: lw - 1.65, h: 1.15, fontFace: FONT.BODY, fontSize: 12.5, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    s.addText('Hypothèses (non mesurées)', { x: lx, y: 2.85, w: lw, h: 0.32, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    const hrows = [
      ['Coût d\'un contact e-mail', nf(sup.contact_cost, 2) + ' €'],
      ['Marge sur le panier', Math.round(sup.margin * 100) + ' %'],
      ['Remise offerte', Math.round(sup.discount * 100) + ' %'],
      ['Clients qui utilisent la remise', Math.round(sup.redeem * 100) + ' %'],
      ['Uplift absolu (bas, central, haut)', [sup.uplift_abs.bas, sup.uplift_abs.central, sup.uplift_abs.haut].map(v => nf(v * 100, 1)).join(' ; ') + ' pt'],
      ['Uplift relatif (bas, central, haut)', [sup.uplift_rel.bas, sup.uplift_rel.central, sup.uplift_rel.haut].map(v => Math.round(v * 100)).join(' ; ') + ' %'],
    ].map(r => [r[0], { t: r[1], bold: true, color: C.ORANGE }]);
    tbl(s, ['Paramètre', 'Valeur supposée'], hrows, { x: lx, y: 3.2, w: lw, colW: [3.0, 2.1], rowH: 0.4, fs: 12, align: ['left', 'center'], firstBold: false });
    // droite : dimensionnement
    const rx = 6.25, rw = W - M - rx;
    const ab = parseCSV('07_ab_dimensionnement.csv').filter(r => Math.abs(Number(r['part_témoin']) - 0.3) < 1e-6);
    const pick = (pop, up) => ab.find(r => r.population === pop && Math.abs(Number(r.uplift_pts) - up) < 1e-6);
    s.addText('Clients nécessaires selon l\'uplift à détecter', { x: rx, y: 1.5, w: rw, h: 0.32, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: C.INK, margin: 0, isTextBox: true });
    const cellN = r => ({ t: thou(r.n_total_requis), bold: true, color: r.tient_dans_Good === 'True' ? C.GREEN : C.SLATE2 });
    const rowsA = [0.5, 1.0, 1.5, 2.0, 3.0].map(u => [nf(u, 1) + ' pt', cellN(pick('Good tous e-mailables', u)), cellN(pick('Good 50 % haut du score', u))]);
    tbl(s, ['Uplift à détecter', 'Tout Good (17 486 clients)', 'Moitié haute du score (9 215)'], rowsA,
      { x: rx, y: 1.95, w: rw, colW: [1.8, 2.45, 2.23], rowH: 0.42, fs: 13, hfs: 12, align: ['left', 'center', 'center'] });
    s.addText('Vert : tient dans l\'effectif disponible. Gris : il faudrait plus de clients que le segment n\'en compte.', { x: rx, y: 4.55, w: rw, h: 0.5, fontFace: FONT.BODY, fontSize: 11, color: C.MUTED, margin: 0, valign: 'top', isTextBox: true });
    const mde = parseCSV('07_ab_mde.csv').find(r => r.population === 'Good tous e-mailables' && Math.abs(Number(r['part_témoin']) - 0.3) < 1e-6);
    s.addText(nf(mde.mde_pts, 2) + ' pt', { x: rx, y: 5.0, w: 2.2, h: 0.7, fontFace: FONT.HEAD, fontSize: 32, bold: true, color: C.GREEN, margin: 0, valign: 'middle', isTextBox: true });
    s.addText('effet minimal détectable sur tout Good, soit ' + nf(mde.mde_relatif, 0) + ' % en relatif', { x: rx + 2.3, y: 5.0, w: rw - 2.3, h: 0.7, fontFace: FONT.BODY, fontSize: 12.5, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    takeaway(s, 'Hypothèse : le seuil de rentabilité (+1,11 pt, remise 10 %) est sous l\'effet minimal détectable (1,22 pt) : un seul test ne tranche pas.');
    s.addNotes('Tout ce qui est en euros est une hypothèse, étiquetée comme telle. Avec 17 486 clients e-mailables et 30 % de témoins, nous ne détectons qu\'un effet d\'au moins 1,22 point : sous ce seuil, il faut plusieurs vagues.');
  }

  // =====================================================================
  // A8 : régression logistique, odds ratios
  // =====================================================================
  {
    const s = base('Annexe · A8 · Régression logistique',
      'La logistique reste lisible : fréquence, dépense et week-end augmentent la cote de rachat',
      { source: 'Source : results/03_odds_ratios.csv (ré-ajustement du modèle Lasso parcimonieux, IC à 95 %), 03_summary.md, 06_summary.md.' });
    const or = parseCSV('03_odds_ratios.csv');
    const lab = {
      share_weekend: 'Part d\'achats le week-end', log_spend_90: 'Dépense sur 90 jours (log)', recency_days: 'Jours depuis le dernier achat',
      log_n_tickets_30: 'Tickets sur 30 jours (log)', share_summer_months: 'Part d\'achats juillet-août', log_n_tickets_180: 'Tickets sur 180 jours (log)',
      log_n_tickets_60: 'Tickets sur 60 jours (log)', log_delay_ratio_mean: 'Retard sur le rythme habituel (log)', is_one_shot: 'Un seul ticket sur l\'année (oui/non)',
      has_interval_std: 'Au moins 3 tickets (oui/non)', recency_prev_days: 'Jours depuis l\'avant-dernier achat', log_n_tickets_14: 'Tickets sur 14 jours (log)',
    };
    const rows = Object.keys(lab).map(k => or.find(r => r.variable === k));
    const x0 = 4.1, pw = 3.6, lo = Math.log(0.4), hi = Math.log(2.2);
    const X = v => x0 + (Math.log(v) - lo) / (hi - lo) * pw;
    const y0 = 1.95, rh = 0.32;
    s.addText('Variable', { x: M, y: 1.5, w: 3.3, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.GREEN, margin: 0, isTextBox: true });
    s.addText('Odds ratio (IC 95 %)', { x: 7.75, y: 1.5, w: 2.0, h: 0.3, fontFace: FONT.BODY, fontSize: 11, bold: true, color: C.GREEN, margin: 0, isTextBox: true });
    // axe et ligne OR = 1
    s.addShape(R.LINE, { x: X(1), y: y0 - 0.05, w: 0, h: rows.length * rh + 0.1, line: { color: C.MUTED, width: 1, dashType: 'dash' } });
    [0.5, 1, 1.5, 2].forEach(t => {
      s.addText(nf(t, t === 1 || t === 2 ? 0 : 1), { x: X(t) - 0.3, y: y0 + rows.length * rh + 0.08, w: 0.6, h: 0.25, fontFace: FONT.BODY, fontSize: 11, color: C.MUTED, align: 'center', margin: 0, isTextBox: true });
    });
    rows.forEach((r, i) => {
      const y = y0 + i * rh, v = Number(r.or_refit), l = Number(r.ic95_bas), h = Number(r.ic95_haut);
      const col = r.variable === 'share_weekend' ? C.ORANGE : (v >= 1 ? C.GREEN : C.SLATE);
      s.addText(lab[r.variable], { x: M, y, w: 3.4, h: rh, fontFace: FONT.BODY, fontSize: 12, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
      s.addShape(R.RECTANGLE, { x: X(l), y: y + rh / 2 - 0.02, w: X(h) - X(l), h: 0.04, fill: { color: col }, line: { color: col } });
      s.addShape(R.OVAL, { x: X(v) - 0.07, y: y + rh / 2 - 0.07, w: 0.14, h: 0.14, fill: { color: col }, line: { color: col } });
      s.addText(`${nf(v, 2)}  [${nf(l, 2)} ; ${nf(h, 2)}]`, { x: 7.8, y, w: 1.95, h: rh, fontFace: FONT.BODY, fontSize: 11.5, bold: true, color: C.INK, margin: 0, valign: 'middle', isTextBox: true });
    });
    // panneau de lecture
    const px = 9.95, pw2 = W - M - px;
    card(s, px, 1.5, pw2, 4.5);
    s.addText('Comment lire', { x: px + 0.2, y: 1.62, w: pw2 - 0.4, h: 0.35, fontFace: FONT.HEAD, fontSize: 15, bold: true, color: C.GREEN, margin: 0, isTextBox: true });
    bullets(s, [
      'Variable continue : effet d\'un écart-type de plus ; variable oui/non : 1 contre 0.',
      'Au-dessus de 1, la cote de rachat augmente ; en dessous, elle diminue.',
      'Les comptages de tickets sont corrélés jusqu\'à 0,92 : lire les coefficients ensemble.',
      'AUC 0,8714 contre 0,8785 pour LightGBM : le plafond d\'un modèle linéaire.',
    ], px + 0.2, 2.05, pw2 - 0.4, 4.3, 12);
    takeaway(s, 'Même sens d\'effet que SHAP pour 14 variables comparables sur 15 : la logistique sert de référence lisible.');
    s.addNotes('La logistique pénalisée est notre référence interprétable : AUC 0,8714. Ses odds ratios vont dans le même sens que les valeurs SHAP du LightGBM pour 14 variables sur 15.');
  }
};
