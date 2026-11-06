const fs = require('fs');

const raw = fs.readFileSync('client/public/officialShareholdersData.json', 'utf8');
const data = JSON.parse(raw);
console.log('Total records:', data.length);

const placeCount = new Map();
const addressLike = [];

data.forEach((s, idx) => {
  const p = (s.place || s.village_name || '').trim();
  if (p) {
    placeCount.set(p, (placeCount.get(p) || 0) + 1);
    if (p.includes(',') || p.includes('/') || /\d/.test(p) || p.length > 25) {
      addressLike.push({ idx, id: s.shareholder_id, name: s.name_kannada || s.name, place: p, taluk: s.taluk });
    }
  }
});

console.log('Total unique places in dataset:', placeCount.size);
console.log('Address-like or suspicious places:', addressLike);

// Also look at places starting with ಅ to see what was shown in the screenshot:
const aPlaces = Array.from(placeCount.keys()).filter(p => p.startsWith('ಅ') || p.startsWith('ಆ')).sort((a,b) => a.localeCompare(b, 'kn'));
console.log('\nPlaces starting with ಅ / ಆ:');
aPlaces.forEach(p => {
  console.log(`- "${p}": count = ${placeCount.get(p)}`);
});
