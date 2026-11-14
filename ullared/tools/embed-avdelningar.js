// Copies avdelningar.json into index.html (the <script id="deptData"> block),
// so the app has the default departments built in and works offline.
// Run from the ullared folder:  node tools/embed-avdelningar.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const depts = JSON.parse(fs.readFileSync(path.join(dir, 'avdelningar.json'), 'utf8'));
const htmlFile = path.join(dir, 'index.html');
const html = fs.readFileSync(htmlFile, 'utf8');

// One department per line keeps diffs readable. Escape "</" so the JSON can't end the script tag.
const body = '[\n' + depts.map(d => JSON.stringify(d)).join(',\n') + '\n]';
const safe = body.replace(/<\//g, '<\\/');

const re = /(<script type="application\/json" id="deptData">\n)[\s\S]*?(\n<\/script>)/;
if (!re.test(html)) { console.error('Hittade inte <script id="deptData"> i index.html'); process.exit(1); }
fs.writeFileSync(htmlFile, html.replace(re, (m, a, b) => a + safe + b));
console.log('Bakade in ' + depts.length + ' avdelningar i index.html');
