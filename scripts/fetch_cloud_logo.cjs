const https = require('https');

const SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

const url = new URL(SUPABASE_URL + '/rest/v1/audit_logs?module=in.(organization_settings,id_card_settings)&select=*');

const req = https.request(url, {
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const data = JSON.parse(body);
      console.log('Rows count:', data.length);
      data.forEach(r => {
        console.log('Module:', r.module, 'record_id:', r.record_id);
        const details = typeof r.details === 'object' ? r.details : JSON.parse(r.details || '{}');
        console.log('Keys in details:', Object.keys(details));
        if (details.logo) {
          console.log('Found details.logo! Length:', details.logo.length);
          require('fs').writeFileSync('scripts/cloud_logo.txt', details.logo, 'utf8');
        }
        if (details.customLogo) {
          console.log('Found details.customLogo! Length:', details.customLogo.length);
        }
      });
    } catch (e) {
      console.log('Error parsing:', e.message, body.substring(0, 200));
    }
  });
});

req.on('error', console.error);
req.end();
