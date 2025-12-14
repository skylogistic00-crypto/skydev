import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  console.log('Creating test users...');
  
  const { data, error } = await supabase.functions.invoke('supabase-functions-create-test-users');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Results:', data);
  
  data.results.forEach((result: any) => {
    if (result.status === 'success') {
      console.log(`✅ ${result.email} - ${result.role}`);
    } else {
      console.log(`❌ ${result.email} - ${result.message}`);
    }
  });
}

createTestUsers();