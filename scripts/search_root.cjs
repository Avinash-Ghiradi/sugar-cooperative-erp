const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
for (const f of fs.readdirSync(rootDir)) {
  if (f.endsWith('.csv') || f.endsWith('.json') || f.endsWith('.txt')) {
    const full = path.join(rootDir, f);
    try {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('186/3') || content.includes('ಹಚ್ಚಾಳ')) {
        console.log('FOUND IN ROOT:', f);
      }
    } catch (e) {}
  }
}
