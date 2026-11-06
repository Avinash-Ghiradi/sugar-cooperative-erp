const fs = require('fs');
const path = require('path');
const XLSX = require('C:/Users/New/.gemini/antigravity/scratch/sugar_cooperative_erp/client/node_modules/xlsx');

const dir = 'C:/Users/New/Downloads';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.xlsx')) {
    try {
      const wb = XLSX.readFile(path.join(dir, file));
      for (const s of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
        for (let i = 0; i < rows.length; i++) {
          const str = JSON.stringify(rows[i]);
          if (str.includes('ಹಚ್ಚಾಳ') || str.includes('186/3')) {
            console.log(`FOUND IN ${file} [${s}] row ${i}:`, str);
          }
        }
      }
    } catch (e) {}
  }
}
