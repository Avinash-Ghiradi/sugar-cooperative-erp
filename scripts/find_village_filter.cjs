const fs = require('fs');

const api = fs.readFileSync('client/src/services/api.js', 'utf8');
const lines = api.split('\n');

let start = -1;
lines.forEach((l, idx) => {
  if (l.includes('async getShareholders(')) start = idx;
  if (start > 0 && idx < start + 60) {
    if (l.includes('village') || l.includes('place')) {
      console.log(`${idx + 1}: ${l.trim()}`);
    }
  }
});
