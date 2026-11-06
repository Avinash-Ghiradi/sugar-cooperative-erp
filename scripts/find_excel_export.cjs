const fs = require('fs');
const content = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('handleExportExcel') || (i >= 813 && i <= 860) || (i >= 990 && i <= 1030)) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
