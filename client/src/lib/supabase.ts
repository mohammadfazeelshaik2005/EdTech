import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ((typeof process !== 'undefined' && process.env) as any || {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Determine if we are configured with a real, valid Supabase cloud instance
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('mock-pathsync') &&
  !supabaseAnonKey.includes('mock-anon-key') &&
  !supabaseAnonKey.includes('your-anon-key') &&
  supabaseAnonKey.startsWith('ey') &&
  supabaseAnonKey.split('.').length === 3 &&
  supabaseAnonKey.length > 50
);

// Standard Supabase Client (safe for client-side usage with public anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
