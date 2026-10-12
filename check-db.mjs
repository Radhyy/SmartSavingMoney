import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const env = fs.readFileSync('.env.local', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function check() {
  const { data: cards } = await supabase.from('rfid_cards').select('*');
  console.log("CARDS:", cards);
  
  const { data: susp } = await supabase.from('suspicious_activities').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("SUSPICIOUS:", susp);
}
check();
