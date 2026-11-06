const fs = require('fs');
const content = fs.readFileSync('client/src/components/Shareholders/ShareholderList.jsx', 'utf8');
const lines = content.split('\n');
let start = false;
lines.forEach((l, i) => {
  if (l.includes('<table')) start = true;
  if (start && i < 1100) {
    if (l.includes('<th') || l.includes('</th>')) {
      console.log((i + 1) + ': ' + l.trim());
    }
  }
  if (l.includes('</table>')) start = false;
});
