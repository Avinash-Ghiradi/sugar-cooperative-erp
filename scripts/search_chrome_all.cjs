const fs = require('fs');
const path = require('path');

function searchDir(dir, query, maxDepth = 4) {
  if (maxDepth <= 0) return;
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchDir(full, query, maxDepth - 1);
      } else if (stat.size < 20 * 1024 * 1024 && (item.endsWith('.ldb') || item.endsWith('.log') || item.endsWith('.vfs'))) {
        try {
          const buf = fs.readFileSync(full);
          const str = buf.toString('latin1');
          if (str.includes(query)) {
            console.log('Found query in:', full, 'size:', stat.size);
            const idx = str.indexOf(query);
            console.log('Context:', str.substring(idx - 50, idx + 200).replace(/[^\x20-\x7E]/g, ' '));
            const imgMatch = str.substring(idx - 100, idx + 5000).match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
            if (imgMatch) {
              console.log('FOUND IMAGE MATCH! Length:', imgMatch[0].length);
              fs.writeFileSync('scripts/extracted_chrome_img.png', Buffer.from(imgMatch[0].split(',')[1], 'base64'));
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
}

console.log('Scanning Chrome User Data for sugar-cooperative-erp...');
searchDir('C:/Users/New/AppData/Local/Google/Chrome/User Data', 'sugar-cooperative-erp');
