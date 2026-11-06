const fs = require('fs');

const f = fs.readFileSync('client/src/components/Reports/ReportsModule.jsx', 'utf8');
const lines = f.split('\n');
console.log('Total lines in ReportsModule:', lines.length);

lines.slice(0, 150).forEach((l, idx) => {
  console.log(`${idx + 1}: ${l}`);
});
