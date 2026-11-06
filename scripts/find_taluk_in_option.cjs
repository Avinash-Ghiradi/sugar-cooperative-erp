const fs = require('fs');
const path = require('path');

function searchTalukInOption(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        searchTalukInOption(full);
      }
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('taluk') && (l.includes('(') || l.includes('`'))) {
          // Check if near option
          const context = lines.slice(Math.max(0, idx - 3), Math.min(lines.length, idx + 4)).join('\n');
          if (context.includes('<option')) {
            console.log(`${full}:${idx+1} -> ${l.trim()}`);
          }
        }
      });
    }
  }
}

searchTalukInOption('client/src');
