const fs = require('fs');

const circle = require('../client/src/services/officialCircleData.json');
const shs = require('../client/public/officialShareholdersData.json');

const circlePlaces = new Set(circle.map(c => (c.address || '').trim()).filter(Boolean));
const shPlaces = new Set(shs.map(s => (s.place || s.village_name || '').trim()).filter(Boolean));

console.log('Total circle places:', circlePlaces.size);
console.log('Total shareholder places:', shPlaces.size);

// Places in shareholders that are NOT in circle directory
const notInCircle = [];
shPlaces.forEach(p => {
  if (!circlePlaces.has(p)) {
    notInCircle.push(p);
  }
});

console.log('Shareholder places not in circle directory count:', notInCircle.length);
console.log('Sample not in circle directory (first 30):', notInCircle.slice(0, 30));
