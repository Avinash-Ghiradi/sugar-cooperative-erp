const fs = require('fs');
const content = fs.readFileSync('client/src/services/api.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function getShareholderSharesCount')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
