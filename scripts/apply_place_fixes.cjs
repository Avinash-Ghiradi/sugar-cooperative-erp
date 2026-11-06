const fs = require('fs');

const cleanPlaceFunc = `export function cleanPlaceName(p) {
  if (!p || typeof p !== 'string') return '';
  let str = p.trim();
  // Strip parentheses content like (ಉಡಪಿ ತಾಲೂಕ, ದ.ಕ.) or (ಇಂಡಿ) or (ಸಿಂದಗಿ) or numbers in parens like (163)
  str = str.replace(/\\([^)]*\\)/g, '').trim();
  // If comma separated like "186/3, ಲಕ್ಷ್ಮೀ ದೇವಾಲಯ ಹತ್ತಿರ, ಹಚ್ಚಾಳ"
  if (str.includes(',')) {
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (!/^[\\d\\/\\-\\#\\s]+$/.test(part) && !/ಹತ್ತಿರ|ಬಳಿ|ಎದುರು|ಹತ್ತರ|ಸಮೀಪ|near|opp/i.test(part)) {
        str = part;
        break;
      }
    }
  }
  // Strip leading house/plot numbers like "186/3 " or "No. 5 " or "#45 "
  str = str.replace(/^[\\d\\/\\-\\#\\,\\s]+/, '').trim();
  // Standardize common variant spelling
  if (str === 'ಅಂಜುಟಗಿ') str = 'ಅಂಜುಟಿಗಿ';
  // Normalize Unicode
  str = str.normalize('NFC').trim();
  return str;
}`;

// 1. Update api.js
let api = fs.readFileSync('client/src/services/api.js', 'utf8');

// Insert cleanPlaceName if not present
if (!api.includes('export function cleanPlaceName(')) {
  api = cleanPlaceFunc + '\n\n' + api;
}

// In fixShiftedShareholder(s)
const fixTarget = `  if (rec2 && rec2 === rec1 && (date2 === date1 || !date2)) {
    updated.date = '';
    updated.reciept = '';
    updated.amount = 0;
  }`;

const fixReplacement = `  if (rec2 && rec2 === rec1 && (date2 === date1 || !date2)) {
    updated.date = '';
    updated.reciept = '';
    updated.amount = 0;
  }

  // Clean composite street addresses from place if necessary
  const rawPlace = String(updated.place || updated.village_name || '').trim();
  if (rawPlace) {
    const cleanedPlace = cleanPlaceName(rawPlace);
    if (cleanedPlace && cleanedPlace !== rawPlace) {
      if (!updated.address) {
        updated.address = rawPlace;
      }
      updated.place = cleanedPlace;
      if (updated.village_name) {
        updated.village_name = cleanedPlace;
      }
    }
  }`;

if (api.includes(fixTarget) && !api.includes('// Clean composite street addresses from place if necessary')) {
  api = api.replace(fixTarget, fixReplacement);
}

// In getFilterOptions:
// Seed 1
const cdSeedTarget = `    for (let i = 0; i < mockCircleDirectory.length; i++) {
      const cd = mockCircleDirectory[i];
      const p = (cd.address || '').trim();`;

const cdSeedReplacement = `    for (let i = 0; i < mockCircleDirectory.length; i++) {
      const cd = mockCircleDirectory[i];
      const p = cleanPlaceName(cd.address || cd.name || '');`;

if (api.includes(cdSeedTarget)) {
  api = api.replace(cdSeedTarget, cdSeedReplacement);
}

// Seed 2
const shSeedTarget = `    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const p = (s.place || s.village_name || '').trim();`;

const shSeedReplacement = `    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const p = cleanPlaceName(s.place || s.village_name || '');`;

if (api.includes(shSeedTarget)) {
  api = api.replace(shSeedTarget, shSeedReplacement);
}

// In getShareholders village_id filter:
const vFilterTarget = `    if (village_id) {
      const vq = village_id.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s =>
        (s.village_id && s.village_id.toLowerCase() === vq) ||
        (s.place && s.place.trim().toLowerCase().normalize('NFC') === vq) ||
        (s.village_name && s.village_name.trim().toLowerCase().normalize('NFC') === vq)
      );
    }`;

const vFilterReplacement = `    if (village_id) {
      const vq = cleanPlaceName(village_id).toLowerCase() || village_id.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s => {
        const pClean = cleanPlaceName(s.place || s.village_name || '').toLowerCase();
        return (
          (s.village_id && s.village_id.toLowerCase() === vq) ||
          (s.place && s.place.trim().toLowerCase().normalize('NFC') === vq) ||
          (s.village_name && s.village_name.trim().toLowerCase().normalize('NFC') === vq) ||
          pClean === vq ||
          (s.place && s.place.toLowerCase().includes(vq)) ||
          (s.village_name && s.village_name.toLowerCase().includes(vq))
        );
      });
    }`;

if (api.includes(vFilterTarget)) {
  api = api.replace(vFilterTarget, vFilterReplacement);
}

// In getVillages():
const getVilCdTarget = `    mockCircleDirectory.forEach((cd, idx) => {
      const rawPlace = (cd.address || '').trim().normalize('NFC');
      if (!rawPlace) return;`;

const getVilCdReplacement = `    mockCircleDirectory.forEach((cd, idx) => {
      const rawPlace = cleanPlaceName(cd.address || cd.name || '');
      if (!rawPlace) return;`;

if (api.includes(getVilCdTarget)) {
  api = api.replace(getVilCdTarget, getVilCdReplacement);
}

const getVilShTarget = `    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawPlace = (s.place || s.village_name || '').trim().normalize('NFC');
      if (!rawPlace) continue;`;

const getVilShReplacement = `    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const rawPlace = cleanPlaceName(s.place || s.village_name || '');
      if (!rawPlace) continue;`;

if (api.includes(getVilShTarget)) {
  api = api.replace(getVilShTarget, getVilShReplacement);
}

fs.writeFileSync('client/src/services/api.js', api, 'utf8');
console.log('Updated api.js successfully!');

// 2. Update cloudDb.js
let cloudDb = fs.readFileSync('client/src/services/cloudDb.js', 'utf8');
if (!cloudDb.includes('cleanPlaceName(')) {
  // Put cleanPlaceName into CloudDbService
  const cdbFixTarget = `    if (rec2 && rec2 === rec1 && (date2 === date1 || !date2)) {
      updated.date = '';
      updated.reciept = '';
      updated.amount = 0;
    }`;

  const cdbFixReplacement = `    if (rec2 && rec2 === rec1 && (date2 === date1 || !date2)) {
      updated.date = '';
      updated.reciept = '';
      updated.amount = 0;
    }

    // Clean composite street addresses from place if necessary
    const rawPlace = String(updated.place || updated.village_name || '').trim();
    if (rawPlace) {
      let str = rawPlace.replace(/\\([^)]*\\)/g, '').trim();
      if (str.includes(',')) {
        const parts = str.split(',').map(s => s.trim()).filter(Boolean);
        for (let i = parts.length - 1; i >= 0; i--) {
          const part = parts[i];
          if (!/^[\\d\\/\\-\\#\\s]+$/.test(part) && !/ಹತ್ತಿರ|ಬಳಿ|ಎದುರು|ಹತ್ತರ|ಸಮೀಪ|near|opp/i.test(part)) {
            str = part;
            break;
          }
        }
      }
      str = str.replace(/^[\\d\\/\\-\\#\\,\\s]+/, '').trim();
      if (str === 'ಅಂಜುಟಗಿ') str = 'ಅಂಜುಟಿಗಿ';
      str = str.normalize('NFC').trim();
      if (str && str !== rawPlace) {
        if (!updated.address) updated.address = rawPlace;
        updated.place = str;
        if (updated.village_name) updated.village_name = str;
      }
    }`;

  if (cloudDb.includes(cdbFixTarget)) {
    cloudDb = cloudDb.replace(cdbFixTarget, cdbFixReplacement);
    fs.writeFileSync('client/src/services/cloudDb.js', cloudDb, 'utf8');
    console.log('Updated cloudDb.js successfully!');
  }
}
