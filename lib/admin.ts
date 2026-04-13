import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_ORG_ID } from '@/src/constants/demoData';

export type PlatformRole = 'ADMIN' | 'EMPLOYEE' | 'SUPPORT' | 'BILLING';

/**
 * Returns the current user's platform role if they are staff. Use with the user's Supabase client (RLS allows reading own row).
 */
export async function getPlatformRole(
  supabase: SupabaseClient
): Promise<PlatformRole | 'super-admin' | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = data?.role as string | null;
  if (role === 'ADMIN' || role === 'EMPLOYEE' || role === 'SUPPORT' || role === 'BILLING' || role === 'super-admin') return role as PlatformRole | 'super-admin';
  return null;
}

export function isPlatformStaff(role: PlatformRole | 'super-admin' | null): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE' || role === 'SUPPORT' || role === 'BILLING' || role === 'super-admin';
}

/**
 * Returns true if the current user can access /admin (owner ID, platform staff, or users.role).
 */
export async function canAccessAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (user.id === ADMIN_OWNER_ID) return true;

  const role = await getPlatformRole(supabase);
  if (isPlatformStaff(role)) return true;

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const r = userRow?.role as string | undefined;
  return r === 'ADMIN' || r === 'EMPLOYEE' || r === 'SUPPORT' || r === 'BILLING';
}

/**
 * Returns true if the current user can impersonate a carrier (view their dashboard with full access).
 * Admin and Support have this; Billing does not.
 */
export async function canImpersonateCarrier(supabase: SupabaseClient): Promise<boolean> {
  if (await isSuperAdmin(supabase)) return true;
  const role = await getPlatformRole(supabase);
  return role === 'ADMIN' || role === 'SUPPORT';
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
 * True when the current user is staff with impersonation (Admin or Support or super-admin) and
 * viewing the dashboard as a carrier (impersonated_org_id cookie is set). Use to grant full access.
 */
export async function isSuperAdminImpersonating(
  supabase: SupabaseClient,
  cookieStore: { get: (name: string) => { value: string } | undefined }
): Promise<boolean> {
  const impersonated = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonated) return false;
  return canImpersonateCarrier(supabase);
}

/**
 * Returns the effective org ID for dashboard data: if staff is impersonating (Admin/Support/super-admin)
 * and impersonated_org_id cookie is set, use that; otherwise use the normal current-org cookie.
 */
export async function getDashboardOrgId(
  supabase: SupabaseClient,
  cookieStore: { get: (name: string) => { value: string } | undefined }
): Promise<string | null> {
  const impersonated = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (impersonated && (await canImpersonateCarrier(supabase))) {
    return impersonated;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (cookieStore.get('vf_demo')?.value === '1') {
      return DEMO_ORG_ID;
    }
    return null;
  }
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
 * Owner ID always returns ADMIN. Then platform_roles (ADMIN/SUPPORT/BILLING/EMPLOYEE map to staff).
 */
export async function getNavbarRole(supabase: SupabaseClient): Promise<NavbarRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (user.id === ADMIN_OWNER_ID) return 'ADMIN';

  const platformRole = await getPlatformRole(supabase);
  if (platformRole === 'ADMIN' || platformRole === 'super-admin') return 'ADMIN';
  if (platformRole === 'SUPPORT' || platformRole === 'BILLING' || platformRole === 'EMPLOYEE') return 'EMPLOYEE';

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const r = (userRow?.role as string) ?? '';
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'EMPLOYEE' || r === 'SUPPORT' || r === 'BILLING') return 'EMPLOYEE';
  return 'CUSTOMER';
}
