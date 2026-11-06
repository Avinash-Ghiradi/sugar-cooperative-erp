const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/public/officialShareholdersData.json'), 'utf8'));

for (let i = 0; i < data.length; i++) {
  const s = data[i];
  const str = JSON.stringify(s);
  if (str.includes('ಹಚ್ಚಾಳ')) {
    console.log(`Found in JSON at index ${i}:`, s);
  }
}
