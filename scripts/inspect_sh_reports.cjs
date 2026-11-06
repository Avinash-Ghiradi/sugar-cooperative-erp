const fs = require('fs');

const f = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = f.split('\n');
console.log('Total lines in ShareholderReports.jsx:', lines.length);

// Print the first 100 lines and report types or tabs
lines.slice(0, 100).forEach((l, idx) => {
  console.log(`${idx + 1}: ${l}`);
});
