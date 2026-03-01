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

/**
 * Returns true only if the current user is staff (ADMIN or EMPLOYEE).
 * Checks platform_roles first, then public.users.role so CUSTOMER never sees admin.
 */
export async function canAccessAdmin(supabase: SupabaseClient): Promise<boolean> {
  const role = await getPlatformRole(supabase);
  if (isPlatformStaff(role)) return true;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const r = userRow?.role as string | undefined;
  return r === 'ADMIN' || r === 'EMPLOYEE' || r === 'SUPPORT';
}
