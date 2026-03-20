import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uawynuqpgagayrrgacpn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhd3ludXFwZ2FnYXlycmdhY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzE2MjgsImV4cCI6MjA4OTQ0NzYyOH0.VK4oDGKD502E4TsEW4yNJbdOjZyjRv9oKLlS8tsE3-k';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('Fetching campaigns with ANON KEY (Simulating Background Worker without Service Role Key)...');
  const { data, error } = await supabase.from('campaigns').select('*');
  console.log('Error:', error);
  console.log('Data returned (Length):', data ? data.length : 0);
  console.log('Data payload:', data);
}

test();
