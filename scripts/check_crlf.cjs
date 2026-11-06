const fs = require('fs');
const content = fs.readFileSync('client/src/services/api.js', 'utf8');
const idx = content.indexOf('Loading official 98-book statutory dataset');
console.log('Found index:', idx);
if (idx !== -1) {
  console.log(JSON.stringify(content.slice(idx - 100, idx + 100)));
}
