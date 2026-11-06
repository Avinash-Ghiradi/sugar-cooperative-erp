const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
    if (fs.statSync(full).isDirectory()) {
      search(full);
    } else if (f.endsWith('.css') || f.endsWith('.jsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('@media print') || content.includes('media print')) {
        console.log('Found in:', full);
      }
    }
  }
}

search('client/src');
