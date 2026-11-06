const fs = require('fs');
const shs = require('../client/public/officialShareholdersData.json');

shs.forEach((s, idx) => {
  const str = JSON.stringify(s);
  if (str.includes('ಅಂಜುಟಗಿ')) {
    console.log(`Row ${idx}:`, s);
  }
});
