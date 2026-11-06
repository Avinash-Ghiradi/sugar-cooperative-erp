const fs = require('fs');
const path = require('path');
const XLSX = require('C:/Users/New/.gemini/antigravity/scratch/sugar_cooperative_erp/client/node_modules/xlsx');

function checkFile(filepath) {
  try {
    if (filepath.endsWith('.xlsx')) {
      const wb = XLSX.readFile(filepath);
      for (const sheetName of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
        for (let i = 0; i < rows.length; i++) {
          const str = JSON.stringify(rows[i]);
          if (str.includes('186') && str.includes('ಲಕ್ಷ್ಮೀ')) {
            console.log(`Found in ${filepath} [${sheetName}] row ${i}:`, str);
          }
        }
      }
    } else if (filepath.endsWith('.csv')) {
      const text = fs.readFileSync(filepath, 'utf8');
      if (text.includes('186/3')) {
        console.log(`Found 186/3 in ${filepath}`);
      }
    }
  } catch (e) {
    console.error(`Error reading ${filepath}:`, e.message);
  }
}

checkFile('C:/Users/New/Downloads/Book1.xlsx');
checkFile(path.join(__dirname, '../shareholders_details1.xlsx'));
checkFile(path.join(__dirname, '../shareholders_details.csv'));
