const fs = require('fs');

console.time('Read JSON');
const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
const data = JSON.parse(raw);
console.timeEnd('Read JSON');
console.log('Records count:', data.length);

console.time('Simulate MasterOptions');
const placesSet = new Set();
const circlesSet = new Set();
const categoriesSet = new Set();
const tharavaSet = new Set();
const cashAmountCounts = new Map();

for (let i = 0; i < data.length; i++) {
  const s = data[i];
  const p = (s.place || s.village_name || '').trim();
  if (p) placesSet.add(p);

  const c = (s.circle || s.circle_name || '').trim();
  if (c && c !== 'ಇತರೆ (Other)') circlesSet.add(c);

  const cat = (s.schedule_cast || '').trim();
  if (cat) categoriesSet.add(cat);

  const tNo = (s.tharava_no || '').trim();
  if (tNo && tNo !== '—' && tNo !== '-') tharavaSet.add(tNo);

  const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
  if (amt > 0) {
    cashAmountCounts.set(amt, (cashAmountCounts.get(amt) || 0) + 1);
  }
}
const places = Array.from(placesSet).sort((a, b) => a.localeCompare(b, 'kn'));
console.timeEnd('Simulate MasterOptions');
console.log('Distinct places:', places.length);
