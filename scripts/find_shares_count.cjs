const fs = require('fs');
const content = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('getShareholderSharesCount')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
