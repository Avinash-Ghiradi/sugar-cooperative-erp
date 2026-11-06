const fs = require('fs');

const app = fs.readFileSync('client/src/App.jsx', 'utf8');
const lines = app.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('ShareholderReports') || l.includes('ReportsModule') || l.includes('reports')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
