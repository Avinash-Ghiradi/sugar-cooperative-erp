const fs = require('fs');
const shs = require('../client/public/officialShareholdersData.json');

let anjutagi = 0;
let anjutigi = 0;
shs.forEach(s => {
  const p = (s.place || s.village_name || '').trim();
  if (p === 'ಅಂಜುಟಗಿ') anjutagi++;
  if (p === 'ಅಂಜುಟಿಗಿ') anjutigi++;
});

console.log('ಅಂಜುಟಗಿ count in official dataset:', anjutagi);
console.log('ಅಂಜುಟಿಗಿ count in official dataset:', anjutigi);
