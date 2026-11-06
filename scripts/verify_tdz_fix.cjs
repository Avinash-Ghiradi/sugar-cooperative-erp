const fs = require('fs');

const content = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
const lines = content.split('\n');

let fLine = -1;
let dLine = -1;
let kLine = -1;

lines.forEach((l, idx) => {
  if (l.includes('const filteredShareholders = useMemo') && fLine === -1) fLine = idx + 1;
  if (l.includes('const detailedTotals = useMemo') && dLine === -1) dLine = idx + 1;
  if (l.includes('const kpis = useMemo') && kLine === -1) kLine = idx + 1;
});

console.log(`filteredShareholders is at line ${fLine}`);
console.log(`kpis is at line ${kLine}`);
console.log(`detailedTotals is at line ${dLine}`);

if (fLine < dLine) {
  console.log('PASS: filteredShareholders is defined BEFORE detailedTotals!');
} else {
  console.log('FAIL: TDZ violation still exists!');
}
