const fs = require('fs');
const path = require('path');
const XLSX = require('C:/Users/New/.gemini/antigravity/scratch/sugar_cooperative_erp/client/node_modules/xlsx');

function check(fp) {
  try {
    const wb = XLSX.readFile(fp);
    for (const s of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
      rows.forEach((r, idx) => {
        const str = JSON.stringify(r);
        if (str.includes('ಹಚ್ಚಾಳ') || str.includes('186/3') || str.includes('ದೇವಾಲಯ')) {
          console.log(`Found in ${fp} row ${idx}:`, str);
        }
      });
    }
  } catch (e) {
    console.error(`Error ${fp}:`, e.message);
  }
}

check(path.join(__dirname, '../circle_details.xlsx'));
check(path.join(__dirname, '../client/public/circle_details.xlsx'));
