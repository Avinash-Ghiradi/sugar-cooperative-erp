const fs = require('fs');
const cloudDbSrc = fs.readFileSync('client/src/services/cloudDb.js', 'utf8');

const urlMatch = cloudDbSrc.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = cloudDbSrc.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const { createClient } = require('./client/node_modules/@supabase/supabase-js');
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('system_settings').select('*').then(({ data, error }) => {
    if (error) {
      console.error('Error fetching settings:', error);
    } else {
      console.log('Settings found:', data.length);
      data.forEach(d => {
        console.log('KEY:', d.key, 'VALUE_LEN:', (d.value || '').length);
        if (d.key.includes('logo') || d.key.includes('org')) {
          console.log('   snippet:', (d.value || '').substring(0, 120));
        }
      });
    }
  });
} else {
  console.log('No URL/KEY match');
}
