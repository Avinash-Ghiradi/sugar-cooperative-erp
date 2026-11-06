const fs = require('fs');
const path = require('path');
const XLSX = require('C:/Users/New/.gemini/antigravity/scratch/sugar_cooperative_erp/client/node_modules/xlsx');

const jsonPath = path.join(__dirname, '../client/public/officialShareholdersData.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('Searching for ಹಚ್ಚಾಳ or 186/3 in JSON...');
const foundInJson = data.filter(s => (s.place && s.place.includes('ಹಚ್ಚಾಳ')) || (s.address && s.address.includes('ಹಚ್ಚಾಳ')) || (s.place && s.place.includes('186/3')));
console.log('Found in JSON:', JSON.stringify(foundInJson, null, 2));

const wb = XLSX.readFile('C:/Users/New/Downloads/Book1.xlsx');
const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });
for (let i = 1; i < sheet1.length; i++) {
  const row = sheet1[i];
  const place = row[17];
  const addr = row[14];
  if ((place && String(place).includes('ಹಚ್ಚಾಳ')) || (place && String(place).includes('186/3'))) {
    console.log(`Excel Row ${i} (Share ${row[2]}): Addr=${addr}, Place=${place}, Taluk=${row[18]}`);
  }
}
