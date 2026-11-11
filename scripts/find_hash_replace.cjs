const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist') return;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) results = results.concat(walk(p));
    else results.push(p);
  });
  return results;
}

const files = walk('C:/Users/New/.gemini/antigravity/scratch/sugar_cooperative_erp/client/src');
files.forEach(f => {
  if (!f.endsWith('.js') && !f.endsWith('.jsx')) return;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('replace(/^#') || line.includes('replace(/^#+') || line.includes('replace(/#/')) {
      console.log(f + ':' + (idx+1) + ': ' + line.trim());
    }
  });
});
