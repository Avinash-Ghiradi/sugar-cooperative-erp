const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      search(full);
    } else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('186/3') || content.includes('ಹಚ್ಚಾಳ') || content.includes('ದೇವಾಲಯ ಹತ್ತಿರ')) {
        console.log('FOUND IN:', full);
      }
    }
  }
}

search(path.join(__dirname, '../client/src'));
