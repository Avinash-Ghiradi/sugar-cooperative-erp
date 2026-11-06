const fs = require('fs');
const content = fs.readFileSync('client/src/components/Common/RegisterListPrintModal.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("type === 'shareholder'") || l.includes('shareholder')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
