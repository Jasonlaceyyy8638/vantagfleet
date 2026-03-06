import { createClient } from '@supabase/supabase-js';

/**
 * Server-side only. Use for actions that need to bypass RLS (e.g. create org on sign-up, accept invite).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Set it in .env.local (Supabase dashboard → Project Settings → API → service_role secret).');
  // Service role key is a JWT (long string), not a UUID; avoid using project ref by mistake
  if (key.length < 100) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY looks invalid (expected a long JWT). Copy the service_role secret from Supabase → Project Settings → API.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
