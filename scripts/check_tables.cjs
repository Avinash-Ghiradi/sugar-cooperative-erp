const DEFAULT_SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

async function check() {
  const tables = ['shareholders', 'new_shareholders', 'varasa_transfers', 'vargavane_transfers', 'circle_directory', 'audit_logs'];
  for (const t of tables) {
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/${t}?limit=1`, {
        headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
      });
      console.log(`Table ${t}: status ${res.status}`);
      if (res.ok) {
        // search for 186 or ಹಚ್ಚಾಳ
        const sRes = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/${t}?select=*&limit=5`, {
          headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
        });
        const rows = await sRes.json();
        // check rows
        console.log(`Table ${t} sample row:`, rows[0] ? Object.keys(rows[0]) : 'empty');
      }
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }
}

check();
