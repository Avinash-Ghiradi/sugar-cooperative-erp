const fs = require('fs');
const path = require('path');

function searchComponents(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        searchComponents(full);
      }
    } else if (entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('All Places') || content.includes('All Villages') || content.includes('villages.map') || content.includes('places.map')) {
        console.log(`Matched file: ${full}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('All Places') || line.includes('All Villages') || line.includes('villages.map') || line.includes('places.map')) {
            console.log(`  L${idx+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchComponents('client/src');
