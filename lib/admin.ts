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
 * Owner ID is always treated as ADMIN so layout/page don't redirect them back to /.
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (user.id === ADMIN_OWNER_ID) return true;

  const role = await getPlatformRole(supabase);
  if (role === 'ADMIN') return true;

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return (userRow?.role as string) === 'ADMIN';
}

/** Platform role can be super-admin (from platform_roles.role). */
export type PlatformRoleSuper = PlatformRole | 'super-admin';

/**
 * Returns true only for super-admins: owner ID or platform_roles.role = 'super-admin'.
 * Used to gate /admin/** and impersonation.
 */
export async function isSuperAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (user.id === ADMIN_OWNER_ID) return true;
  const { data } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  return (data?.role as string) === 'super-admin';
}

const ORG_COOKIE = 'vantag-current-org-id';
export const IMPERSONATE_COOKIE = 'impersonated_org_id';

/**
 * Returns the effective org ID for dashboard data: if user is super-admin and
 * impersonated_org_id cookie is set, use that; otherwise use the normal current-org cookie.
 * Use this in dashboard layout and pages so impersonation is respected.
 */
export async function getDashboardOrgId(
  supabase: SupabaseClient,
  cookieStore: { get: (name: string) => { value: string } | undefined }
): Promise<string | null> {
  const impersonated = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (impersonated && (await isSuperAdmin(supabase))) {
    return impersonated;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null)));
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  return stored && orgIds.includes(stored) ? stored : orgIds[0] ?? null;
}

/** Role used for Navbar: platform_roles + public.users, not profiles (profiles.role is per-org app_role). */
export type NavbarRole = 'ADMIN' | 'OWNER' | 'EMPLOYEE' | 'CUSTOMER';

/** VantagFleet owner: always treat as ADMIN for Navbar and redirects. */
export const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

/**
 * Returns the current user's role for Navbar/redirect logic.
 * Owner ID always returns ADMIN. Then platform_roles, then public.users.role.
 */
export async function getNavbarRole(supabase: SupabaseClient): Promise<NavbarRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (user.id === ADMIN_OWNER_ID) return 'ADMIN';

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
