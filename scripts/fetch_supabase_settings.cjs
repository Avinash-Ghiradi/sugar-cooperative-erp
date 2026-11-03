const https = require('https');

const SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

const url = new URL(SUPABASE_URL + '/rest/v1/system_settings?select=*');

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
        console.log('KEY:', r.key, 'VAL_LEN:', (r.value || '').length);
        if (r.key.includes('logo') || r.key.includes('org')) {
          console.log('   Preview:', (r.value || '').substring(0, 100));
        }
      });
    } catch (e) {
      console.log('Raw body snippet:', body.substring(0, 300));
    }
  });
});

req.on('error', console.error);
req.end();
