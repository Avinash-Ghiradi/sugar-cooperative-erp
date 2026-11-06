const fs = require('fs');
const path = require('path');
const XLSX = require('C:/Users/New/.gemini/antigravity/scratch/sugar_cooperative_erp/client/node_modules/xlsx');

const wb = XLSX.readFile('C:/Users/New/Downloads/Book1.xlsx');
const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });

const placeMap = new Map();
for (let i = 1; i < sheet1.length; i++) {
  const row = sheet1[i];
  const place = (row[17] !== undefined && row[17] !== null) ? String(row[17]).trim() : '';
  if (place) {
    placeMap.set(place, (placeMap.get(place) || 0) + 1);
  }
}

console.log('Total unique places in Book1.xlsx:', placeMap.size);

// Print places that contain numbers or commas or unusual characters
const unusual = [];
for (const [p, count] of placeMap.entries()) {
  if (/\d/.test(p) || p.includes(',') || p.includes('ದೇವಾಲಯ') || p.includes('ಹತ್ತಿರ')) {
    unusual.push({ place: p, count });
  }
}

console.log('Unusual places (with numbers/commas):', unusual);

const sorted = Array.from(placeMap.entries()).sort((a, b) => b[1] - a[1]);
console.log('Top 15 places:', sorted.slice(0, 15));
