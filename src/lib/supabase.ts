import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mockAuth } from './mock-supabase-auth';

const isMockAuth = import.meta.env.VITE_AUTH_MOCK === 'true';

function createRealClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }
  return createClient(url, anonKey);
}

function createMockClient() {
  return { auth: mockAuth } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isMockAuth
  ? createMockClient()
  : createRealClient();
