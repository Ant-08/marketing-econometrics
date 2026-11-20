// Assemble le deck. Usage :  node build.js [out.pptx] [section ...]
//   sans section : toutes (s1, s2, s3, annexes) ; avec : seulement celles listées (test d'une section isolée).
// Environnement : NODE_PATH=~/.cache/marketing-econometrics/deck_node/node_modules (pptxgenjs hors de Drive)
const path = require('path');
const makeTheme = require('./theme');

const args = process.argv.slice(2);
const out = args[0] && args[0].endsWith('.pptx') ? args.shift() : path.join(__dirname, 'Projet2_Repurchase.pptx');
const wanted = args.length ? args : ['s1', 's2', 's3', 'annexes'];

const T = makeTheme();
for (const name of wanted) {
  const f = path.join(__dirname, 'sections', name + '.js');
  require(f)(T);
}
T.pres.writeFile({ fileName: out }).then(() => console.log('écrit :', out, '—', T.slideNo, 'slides'));
