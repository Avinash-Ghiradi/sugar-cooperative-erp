const fs = require('fs');
const path = require('path');

const cd = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/src/services/officialCircleData.json'), 'utf8'));
const match = cd.filter(c => JSON.stringify(c).includes('186/3') || JSON.stringify(c).includes('ಹಚ್ಚಾಳ'));
console.log('Matches in officialCircleData.json:', match);

const matchAddr = cd.filter(c => c.address && c.address.includes(','));
console.log('Sample addresses with comma in officialCircleData.json:', matchAddr.slice(0, 5));
