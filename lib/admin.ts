import type { SupabaseClient } from '@supabase/supabase-js';

export type PlatformRole = 'ADMIN' | 'EMPLOYEE';

/**
 * Returns the current user's platform role if they are staff. Use with the user's Supabase client (RLS allows reading own row).
 */
export async function getPlatformRole(
  supabase: SupabaseClient
): Promise<PlatformRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = data?.role as PlatformRole | null;
  if (role === 'ADMIN' || role === 'EMPLOYEE') return role;
  return null;
}

export function isPlatformStaff(role: PlatformRole | null): role is PlatformRole {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}
