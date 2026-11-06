const fs = require('fs');

const content = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('filteredShareholders') || l.includes('detailedTotals') || l.includes('is15PresetActive')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
