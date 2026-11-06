const DEFAULT_SUPABASE_URL = 'https://lrzzmcmiamufpruywucy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyenptY21pYW11ZnBydXl3dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDkwNTIsImV4cCI6MjEwODA4NTA1Mn0.EyUfa0VR3OoQj4BopOwya1q60mBNd5ubHbCe7tAWgFo';

async function check() {
  const res1 = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/shareholders?place=ilike.*186/3*`, {
    headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
  });
  console.log('Place with 186/3:', await res1.json());

  const res2 = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/shareholders?address=ilike.*186/3*`, {
    headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
  });
  console.log('Address with 186/3:', await res2.json());
}

check();
