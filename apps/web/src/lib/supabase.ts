import { createClient } from '@supabase/supabase-js';
import { MockSupabaseClient } from './mock-supabase';
import { createFetchWithTimeout } from './supabase-fetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('placeholder-project') ||
  supabaseAnonKey.includes('placeholder-anon-key');

export const isMockSupabase = isPlaceholder;

export const supabase = isPlaceholder
  ? (new MockSupabaseClient() as any)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        fetch: createFetchWithTimeout(20_000),
      },
    });
