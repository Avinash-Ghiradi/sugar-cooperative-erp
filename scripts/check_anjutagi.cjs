const fs = require('fs');

const shs = require('../client/public/officialShareholdersData.json');
const circle = require('../client/src/services/officialCircleData.json');

const anjuSh = shs.filter(s => (s.place || '').includes('ಅಂಜುಟ') || (s.place || '').includes('ಅಂಜುಟಿ'));
console.log('Shareholders with Anjutagi/Anjutigi:', anjuSh.length);
const anjuPlaces = new Set(anjuSh.map(s => s.place));
console.log('Unique shareholder places for Anjutagi:', Array.from(anjuPlaces));

const circleAnju = circle.filter(c => (c.address || '').includes('ಅಂಜುಟ') || (c.address || '').includes('ಅಂಜುಟಿ'));
console.log('Circle directory for Anjutagi:', circleAnju);
