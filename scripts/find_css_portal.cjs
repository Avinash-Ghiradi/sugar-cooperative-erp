const fs = require('fs');
const content = fs.readFileSync('client/src/index.css', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('register-list-printing') || l.includes('register-list-print-portal')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
