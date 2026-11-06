const fs = require('fs');

console.time('Read officialShareholdersData.json');
const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
console.timeEnd('Read officialShareholdersData.json');

console.time('JSON.parse 17085 records');
const data = JSON.parse(raw);
console.timeEnd('JSON.parse 17085 records');

console.time('getAllShareholdersRaw simulation');
const transformed = data.map(s => {
  return {
    ...s,
    ownership: 'ಸ್ವಂತ (Self)',
    relationship: 'ಸ್ವಂತ (Self)',
    member_type: 'ವೈಯಕ್ತಿಕ'
  };
});
console.timeEnd('getAllShareholdersRaw simulation');

console.time('placewiseData computation');
const placeMap = new Map();
transformed.forEach(s => {
  const p = s.place || 'Unknown';
  if (!placeMap.has(p)) placeMap.set(p, { count: 0, totalShares: 0, totalAmount: 0 });
  const item = placeMap.get(p);
  item.count++;
  item.totalShares += 1;
  item.totalAmount += 2000;
});
console.timeEnd('placewiseData computation');
