const fs = require('fs');
const content = fs.readFileSync('client/src/components/Shareholders/ShareholderList.jsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < 50; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
