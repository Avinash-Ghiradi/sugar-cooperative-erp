const fs = require('fs');
const path = 'C:/Users/New/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb';

const files = fs.readdirSync(path).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
console.log('LevelDB files found:', files.length);

let foundLogo = null;

for (const f of files) {
  try {
    const buf = fs.readFileSync(path + '/' + f);
    const content = buf.toString('latin1');
    const idx = content.indexOf('sugar_erp_company_logo');
    if (idx !== -1) {
      console.log('Found sugar_erp_company_logo in', f, 'at index', idx);
      const snippet = content.substring(idx, idx + 500);
      console.log('Snippet:', snippet.substring(0, 150));
      // Extract data:image
      const match = content.substring(idx).match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
      if (match) {
        console.log('EXTRACTED DATA URL! Length:', match[0].length);
        foundLogo = match[0];
        break;
      }
    }
    const idx2 = content.indexOf('sugar_erp_id_card_custom_settings');
    if (idx2 !== -1) {
      console.log('Found sugar_erp_id_card_custom_settings in', f);
      const match = content.substring(idx2).match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
      if (match) {
        console.log('EXTRACTED CUSTOM LOGO DATA URL! Length:', match[0].length);
        if (!foundLogo) foundLogo = match[0];
      }
    }
  } catch (e) {
    console.warn('Could not read', f, e.message);
  }
}

if (foundLogo) {
  fs.writeFileSync('scripts/user_uploaded_logo.png', Buffer.from(foundLogo.split(',')[1], 'base64'));
  console.log('Successfully saved scripts/user_uploaded_logo.png !');
} else {
  console.log('No logo data URL found in Chrome LevelDB.');
}
