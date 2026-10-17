const fs = require('fs');
const lines = fs.readFileSync('client/public/circle_details.csv', 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
console.log('Total non-empty lines:', lines.length);

const circleMap = {};
const records = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = [];
  let inQ = false;
  let cur = '';
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  parts.push(cur.trim());
  const addr = parts[0] ? parts[0].replace(/^"|"$/g, '').trim() : '';
  const circle = parts[1] ? parts[1].replace(/^"|"$/g, '').trim() : '';
  const taluk = parts[2] ? parts[2].trim() : '';
  const district = parts[3] ? parts[3].trim() : '';
  const pincode = parts[4] ? parts[4].trim() : '';
  const incharge = parts[5] ? parts[5].trim() : '';
  const contact = parts[6] ? parts[6].trim() : '';

  if (!addr && !circle) continue;

  records.push({
    id: records.length + 1,
    address: addr,
    circle_name: circle || 'ಇತರೆ',
    taluk: taluk,
    district: district,
    pincode: pincode,
    circle_in_charge: incharge,
    contact_no: contact
  });

  const cKey = circle || 'ಇತರೆ';
  if (!circleMap[cKey]) circleMap[cKey] = [];
  circleMap[cKey].push(addr);
}

console.log('Total parsed records:', records.length);
console.log('\n--- CIRCLE-WISE LIST ---');
for (const c of Object.keys(circleMap).sort()) {
  console.log(`${c}: ${circleMap[c].length} villages`);
}
fs.writeFileSync('client/src/services/officialCircleData.json', JSON.stringify(records, null, 2), 'utf8');
console.log('\nWrote client/src/services/officialCircleData.json successfully!');
