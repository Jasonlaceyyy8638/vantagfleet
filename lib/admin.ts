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

/**
 * Returns true only when the current user's role is exactly 'ADMIN'.
 * Used to show/hide the Admin link and to protect /admin routes (admin-only).
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const role = await getPlatformRole(supabase);
  if (role === 'ADMIN') return true;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return (userRow?.role as string) === 'ADMIN';
}

/** Role used for Navbar: platform_roles + public.users, not profiles (profiles.role is per-org app_role). */
export type NavbarRole = 'ADMIN' | 'OWNER' | 'EMPLOYEE' | 'CUSTOMER';

/**
 * Returns the current user's role for Navbar/redirect logic.
 * ADMIN/OWNER: platform_roles.role === 'ADMIN' or public.users.role === 'ADMIN' (same UI).
 * EMPLOYEE: platform_roles.role === 'EMPLOYEE' or public.users.role === 'EMPLOYEE'.
 * CUSTOMER: otherwise.
 */
export async function getNavbarRole(supabase: SupabaseClient): Promise<NavbarRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const platformRole = await getPlatformRole(supabase);
  if (platformRole === 'ADMIN') return 'ADMIN';
  if (platformRole === 'EMPLOYEE') return 'EMPLOYEE';

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const r = (userRow?.role as string) ?? '';
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'EMPLOYEE') return 'EMPLOYEE';
  return 'CUSTOMER';
}
