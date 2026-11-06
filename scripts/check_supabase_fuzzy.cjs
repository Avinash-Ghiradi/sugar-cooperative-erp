const DEFAULT_SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

async function check() {
  const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/shareholders?or=(place.ilike.*186*,address.ilike.*186*,place.ilike.*ಹತ್ತಿರ*,address.ilike.*ಹತ್ತಿರ*)`, {
    headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
  });
  const data = await res.json();
  console.log('Matches in Supabase:', data);
}

check();
