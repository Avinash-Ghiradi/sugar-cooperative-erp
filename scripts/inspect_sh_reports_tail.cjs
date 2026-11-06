const fs = require('fs');

const f = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = f.split('\n');
console.log('Total lines:', lines.length);
lines.slice(1820, 2030).forEach((l, idx) => {
  console.log(`${idx + 1821}: ${l}`);
});
