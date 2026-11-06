const fs = require('fs');
const content = fs.readFileSync('client/src/components/Shareholders/ShareholderList.jsx', 'utf8');

const matches = content.match(/([a-zA-Z0-9_]+)\s*\(/g);
const uniq = Array.from(new Set(matches.map(m => m.replace('(', '').trim())));
console.log('Unique function calls in ShareholderList:', uniq.length);
