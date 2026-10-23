const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      checkDir(full);
    } else if (f.endsWith('.jsx')) {
      const code = fs.readFileSync(full, 'utf8');
      const hooks = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback'];
      for (const h of hooks) {
        if (new RegExp('\\b' + h + '\\b').test(code)) {
          const importMatch = code.match(/import\s+[^;]+from\s+['"]react['"]/);
          if (importMatch) {
            if (!importMatch[0].includes(h) && !code.includes('React.' + h)) {
              console.log('[MISSING HOOK]', f, 'uses', h, 'but not in react import:', importMatch[0]);
            }
          }
        }
      }
    }
  }
}

checkDir(path.resolve(__dirname, '../client/src'));
console.log('Hook check complete.');
