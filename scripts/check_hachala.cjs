const fs = require('fs');

const officialCircle = require('../client/src/services/officialCircleData.json');
const circleMatch = officialCircle.filter(c => (c.address || '').includes('ಹಚ್ಚಾಳ') || (c.address || '').includes('186'));
console.log('Circle matches for ಹಚ್ಚಾಳ:', circleMatch);

const shs = require('../client/public/officialShareholdersData.json');
const shMatches = shs.filter(s => (s.place || '').includes('ಹಚ್ಚಾಳ') || (s.village_name || '').includes('186') || (s.place || '').includes('186'));
console.log('Shareholders matches for ಹಚ್ಚಾಳ or 186:', shMatches.map(s => ({ id: s.shareholder_id, name: s.name_kannada || s.name, place: s.place, taluk: s.taluk })));
