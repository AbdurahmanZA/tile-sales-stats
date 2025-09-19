import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('count(*)')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Supabase connected but tables not yet created');
      return { connected: true, tablesExist: false };
    } else if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return { connected: false, error: error.message };
    }
    
    console.log('✅ Supabase connected successfully');
    return { connected: true, tablesExist: true };
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return { connected: false, error: err.message };
  }
}

export default supabase;