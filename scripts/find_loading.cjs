const fs = require('fs');
const lines = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('loading')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
