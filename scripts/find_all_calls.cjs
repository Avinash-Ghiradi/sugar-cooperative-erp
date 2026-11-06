const fs = require('fs');
const content = fs.readFileSync('client/src/components/Common/RegisterListPrintModal.jsx', 'utf8');

// Find all function calls or identifiers that look like custom functions
const matches = content.match(/([a-zA-Z0-9_]+)\s*\(/g);
const uniq = Array.from(new Set(matches.map(m => m.replace('(', '').trim())));
console.log('Unique function calls:', uniq);
