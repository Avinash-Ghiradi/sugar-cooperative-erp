const fs = require('fs');
const content = fs.readFileSync('client/src/components/Shareholders/ShareholderList.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('@media print') || l.includes('print:') || l.includes('no-print')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
