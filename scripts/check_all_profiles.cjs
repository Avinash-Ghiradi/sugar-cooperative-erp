const fs = require('fs');
const path = require('path');

const chromeRoot = 'C:/Users/New/AppData/Local/Google/Chrome/User Data';
const profiles = ['Default', 'Profile 12', 'Profile 13', 'Profile 4', 'Profile 8'];

profiles.forEach(p => {
  const ldbDir = path.join(chromeRoot, p, 'Local Storage', 'leveldb');
  if (fs.existsSync(ldbDir)) {
    const files = fs.readdirSync(ldbDir);
    console.log(`\n=== Checking ${p} (${files.length} files) ===`);
    files.forEach(f => {
      try {
        const buf = fs.readFileSync(path.join(ldbDir, f));
        const str = buf.toString('latin1');
        if (str.includes('sugar_erp')) {
          console.log(`Found sugar_erp in ${p}/${f}`);
          // Look for any data:image
          const matches = str.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g);
          if (matches) {
            console.log(`  Found ${matches.length} data:image matches!`);
            matches.forEach((m, idx) => {
              console.log(`  Match ${idx}: ${m.length} chars`);
              fs.writeFileSync(`scripts/${p.replace(' ','_')}_img_${idx}.png`, Buffer.from(m.split(',')[1], 'base64'));
            });
          }
        }
      } catch (e) {}
    });
  }
});
