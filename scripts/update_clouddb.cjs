const fs = require('fs');

let c = fs.readFileSync('client/src/services/cloudDb.js', 'utf8');

const target = `    if (rec2 && rec2 === rec1 && (date2 === date1 || !date2)) {
      updated.date = '';
      updated.reciept = '';
      updated.amount = 0;
    }`;

const repl = `    if (rec2 && rec2 === rec1 && (date2 === date1 || !date2)) {
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

// Normalize line endings for replacement
const cLf = c.replace(/\r\n/g, '\n');
const targetLf = target.replace(/\r\n/g, '\n');
const replLf = repl.replace(/\r\n/g, '\n');

if (cLf.includes(targetLf)) {
  const updatedLf = cLf.replace(targetLf, replLf);
  // Preserve CRLF if original had it
  const finalContent = c.includes('\r\n') ? updatedLf.replace(/\n/g, '\r\n') : updatedLf;
  fs.writeFileSync('client/src/services/cloudDb.js', finalContent, 'utf8');
  console.log('Successfully updated cloudDb.js!');
} else {
  console.log('Target not found in cloudDb.js');
}
