const fs = require('fs');
const path = require('path');

function searchSelects(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        searchSelects(full);
      }
    } else if (entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('<select') || l.includes('<Select')) {
          // Check subsequent 15 lines
          let slice = lines.slice(idx, idx + 15).join('\n');
          if (slice.includes('place') || slice.includes('village') || slice.includes('Village') || slice.includes('Place')) {
            console.log(`${full}:${idx+1}`);
            console.log(slice);
            console.log('-----------------------------------');
          }
        }
      });
    }
  }
}

searchSelects('client/src');
