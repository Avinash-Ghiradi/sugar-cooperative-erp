const DEFAULT_SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

async function check() {
  const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/shareholders?select=place,taluk&order=place.asc`, {
    headers: {
      apikey: DEFAULT_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
      Range: '0-99'
    }
  });
  const data = await res.json();
  console.log('Sample 30 places from Supabase:');
  const seen = new Set();
  data.forEach(d => {
    if (!seen.has(d.place)) {
      seen.add(d.place);
      console.log(d);
    }
  });
}

check();
