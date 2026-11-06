const fs = require('fs');
const path = require('path');

const cd = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/src/services/officialCircleData.json'), 'utf8'));

console.log('Total in circle directory:', cd.length);
console.log('First 5 items:', cd.slice(0, 5));
for (let i = 0; i < cd.length; i++) {
  if (cd[i].address && (cd[i].address.includes('186') || cd[i].address.includes('ಲಕ್ಷ್ಮೀ') || cd[i].address.includes('ಹಚ್ಚಾಳ'))) {
    console.log(`Found in circle directory [${i}]:`, cd[i]);
  }
}
