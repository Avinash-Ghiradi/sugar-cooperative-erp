const fs = require('fs');
const path = 'C:/Users/New/AppData/Local/Google/Chrome/User Data/Profile 13/Local Storage/leveldb';

if (fs.existsSync(path)) {
  const files = fs.readdirSync(path).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
  console.log('Profile 13 LevelDB files:', files);
  for (const f of files) {
    const buf = fs.readFileSync(path + '/' + f);
    const content = buf.toString('latin1');
    console.log('Checking', f, 'size:', buf.length);
    if (content.includes('sugar_erp_company_logo')) {
      console.log('FOUND sugar_erp_company_logo in', f);
      const idx = content.indexOf('sugar_erp_company_logo');
      const sub = content.substring(idx, idx + 50000);
      const m = sub.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
      if (m) {
        console.log('FOUND LOGO IN PROFILE 13! Length:', m[0].length);
        fs.writeFileSync('scripts/profile13_logo.png', Buffer.from(m[0].split(',')[1], 'base64'));
      }
    }
    if (content.includes('sugar_erp_id_card_custom_settings')) {
      console.log('FOUND sugar_erp_id_card_custom_settings in', f);
      const idx = content.indexOf('sugar_erp_id_card_custom_settings');
      const sub = content.substring(idx, idx + 50000);
      const m = sub.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
      if (m) {
        console.log('FOUND ID CARD CUSTOM LOGO IN PROFILE 13! Length:', m[0].length);
        fs.writeFileSync('scripts/profile13_id_logo.png', Buffer.from(m[0].split(',')[1], 'base64'));
      }
    }
  }
} else {
  console.log('Profile 13 Local Storage does not exist');
}
