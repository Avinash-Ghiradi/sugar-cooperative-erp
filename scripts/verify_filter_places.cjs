const fs = require('fs');

const officialCircle = require('../client/src/services/officialCircleData.json');
const shs = require('../client/public/officialShareholdersData.json');

function cleanPlaceName(p) {
  if (!p || typeof p !== 'string') return '';
  let str = p.trim();
  str = str.replace(/\([^)]*\)/g, '').trim();
  if (str.includes(',')) {
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (!/^[\d\/\-\#\s]+$/.test(part) && !/ಹತ್ತಿರ|ಬಳಿ|ಎದುರು|ಹತ್ತರ|ಸಮೀಪ|near|opp/i.test(part)) {
        str = part;
        break;
      }
    }
  }
  str = str.replace(/^[\d\/\-\#\,\s]+/, '').trim();
  if (str === 'ಅಂಜುಟಗಿ') str = 'ಅಂಜುಟಿಗಿ';
  str = str.normalize('NFC').trim();
  return str;
}

const villageMap = new Map();

// 1. Seed
for (let i = 0; i < officialCircle.length; i++) {
  const cd = officialCircle[i];
  const p = cleanPlaceName(cd.address || cd.name || '');
  if (p) {
    if (!villageMap.has(p)) {
      villageMap.set(p, {
        village_id: `VIL-${String(villageMap.size + 1).padStart(3, '0')}`,
        name: p,
        taluk: cd.taluk || '',
        district: cd.district || '',
        circle_name: cd.circle_name || 'ಇತರೆ',
        pin_code: cd.pincode || '',
        shareholder_count: 0,
        total_shares: 0
      });
    }
  }
}

// 2. Loop shareholders
for (let i = 0; i < shs.length; i++) {
  const s = shs[i];
  const p = cleanPlaceName(s.place || s.village_name || '');
  if (p) {
    if (!villageMap.has(p)) {
      villageMap.set(p, {
        village_id: `VIL-${String(villageMap.size + 1).padStart(3, '0')}`,
        name: p,
        taluk: s.taluk || '',
        district: s.district || '',
        circle_name: s.circle || 'ಇತರೆ',
        pin_code: s.pin_code || '',
        shareholder_count: 0,
        total_shares: 0
      });
    }
    const vItem = villageMap.get(p);
    vItem.shareholder_count++;
  }
}

const sortedVillages = Array.from(villageMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'kn'));
console.log('Total unique places in filter:', sortedVillages.length);
console.log('First 20 places:');
sortedVillages.slice(0, 20).forEach((v, idx) => {
  console.log(`  ${idx + 1}. "${v.name}" (Count: ${v.shareholder_count})`);
});

// Check if any place contains comma, slash, digits or parens:
const invalid = sortedVillages.filter(v => v.name.includes(',') || v.name.includes('/') || /\d/.test(v.name) || v.name.includes('('));
console.log('\nAny invalid/unclean place names?');
console.log(invalid);
