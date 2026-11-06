const fs = require('fs');

const f = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = f.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('reportMode ===') || l.includes('setReportMode') || l.includes('Print') || l.includes('table') || l.includes('15 ಕಾಲಂ') || l.includes('ನೋಂದಣಿ ವಹಿ')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
