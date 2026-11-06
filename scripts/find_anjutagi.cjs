const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== 'build') {
        searchDir(full);
      }
    } else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.json') || f.endsWith('.xlsx') || f.endsWith('.csv')) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('ಅಂಜುಟಗಿ')) {
          console.log(`Found in: ${full}`);
        }
      } catch (e) {}
    }
  }
}

searchDir('.');
