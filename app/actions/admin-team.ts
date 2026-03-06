'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformRole, isPlatformStaff, isAdmin } from '@/lib/admin';
import { sendEmail } from '@/lib/mail';
import { getWelcomeToTeamEmail, getAddedToTeamEmail } from '@/lib/invite-email';
import { randomBytes, randomUUID } from 'crypto';

export type StaffRow = { user_id: string; role: string; email: string | null };

/** Role displayed on My Team (vantag_staff). Admin = full; Support = full + impersonate; Billing = billing only. */
export type VantagStaffRole = 'Support' | 'Sales' | 'Manager' | 'Admin' | 'Billing';

export type VantagStaffRow = {
  id: string;
  user_id: string;
  role: VantagStaffRole;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at?: string;
};

/** Map vantag_staff role to platform_roles.role for /admin access. */
function toPlatformRole(role: VantagStaffRole): 'ADMIN' | 'SUPPORT' | 'BILLING' | 'EMPLOYEE' {
  if (role === 'Admin') return 'ADMIN';
  if (role === 'Support') return 'SUPPORT';
  if (role === 'Billing') return 'BILLING';
  return 'EMPLOYEE';
}

/** Allow owner (ADMIN_OWNER_ID) and anyone in platform_roles or users.role ADMIN/EMPLOYEE. */
async function requireStaff() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (admin) return;
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) throw new Error('Forbidden');
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** List all users from vantag_staff with emails from Auth. */
export async function listVantagStaff(): Promise<VantagStaffRow[]> {
  await requireStaff();
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('vantag_staff')
    .select('id, user_id, role, full_name, phone, created_at')
    .order('created_at', { ascending: false });

  if (error || !rows?.length) return [];

  const result: VantagStaffRow[] = [];
  for (const row of rows) {
    let email: string | null = null;
    if (isValidUuid(row.user_id)) {
      try {
        const { data: { user } } = await admin.auth.admin.getUserById(row.user_id);
        email = user?.email ?? null;
      } catch {
        // skip email if Auth call fails (e.g. user deleted)
      }
    }
    result.push({
      id: row.id,
      user_id: row.user_id,
      role: row.role as VantagStaffRole,
      email,
      full_name: (row as { full_name?: string | null }).full_name ?? null,
      phone: (row as { phone?: string | null }).phone ?? null,
      created_at: row.created_at,
    });
  }
  return result;
}

/** List current staff (platform_roles + email from Auth). */
export async function listStaff(): Promise<StaffRow[]> {
  await requireStaff();
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('platform_roles')
    .select('user_id, role')
    .order('role');

  if (error || !rows?.length) return [];

  const result: StaffRow[] = [];
  for (const row of rows) {
    let email: string | null = null;
    if (isValidUuid(row.user_id)) {
      try {
        const { data: { user } } = await admin.auth.admin.getUserById(row.user_id);
        email = user?.email ?? null;
      } catch {
        // skip email if Auth call fails
      }
    }
    result.push({
      user_id: row.user_id,
      role: row.role,
      email,
    });
  }
  return result;
}

/** Add an employee by email: look up user in Auth, add to platform_roles. They must have signed up first. */
export async function addEmployeeByEmail(
  email: string,
  role: 'ADMIN' | 'EMPLOYEE'
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required.' };
  if (role !== 'ADMIN' && role !== 'EMPLOYEE') return { error: 'Invalid role.' };

  const admin = createAdminClient();
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { error: listError.message };

  const found = users?.find((u) => u.email?.toLowerCase() === trimmed);
  if (!found) {
    return { error: 'No account found with that email. They need to sign up at the app first.' };
  }

  const { error: insertError } = await admin
    .from('platform_roles')
    .upsert({ user_id: found.id, role }, { onConflict: 'user_id' });

  if (insertError) return { error: insertError.message };
  return { ok: true };
}

/** Remove staff role (they become a normal customer again). */
export async function removeStaff(userId: string): Promise<{ error?: string }> {
  await requireStaff();
  const admin = createAdminClient();
  const { error } = await admin.from('platform_roles').delete().eq('user_id', userId);
  if (error) return { error: error.message };
  return {};
}

/** Add employee to vantag_staff by email and assign role. Name and phone are required. If user does not exist, only Admin can create account and send welcome email with temporary password. */
export async function addVantagStaffMember(
  email: string,
  role: VantagStaffRole,
  name: string,
  phone: string
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required.' };
  const fullName = name?.trim();
  if (!fullName) return { error: 'Full name is required.' };
  const phoneTrimmed = phone?.trim();
  if (!phoneTrimmed) return { error: 'Phone number is required.' };
  const validRoles: VantagStaffRole[] = ['Support', 'Sales', 'Manager', 'Admin', 'Billing'];
  if (!validRoles.includes(role)) return { error: 'Invalid role.' };

  const admin = createAdminClient();
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { error: listError.message };

  let found = users?.find((u) => u.email?.toLowerCase() === trimmed);

  if (!found) {
    const supabase = await createClient();
    const callerIsAdmin = await isAdmin(supabase);
    if (!callerIsAdmin) {
      return { error: 'No account found with that email. Only Admins can create new accounts and send a welcome email.' };
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const tempPassword = Array.from({ length: 12 }, () => chars[randomBytes(1)[0]! % chars.length]).join('');
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: trimmed,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });
    if (createError) return { error: createError.message };
    if (!newUser.user) return { error: 'Failed to create user.' };
    found = newUser.user;

    const platformRole = toPlatformRole(role);
    const { error: staffErr } = await admin.from('vantag_staff').insert({
      id: found.id,
      user_id: found.id,
      role,
      full_name: fullName,
      phone: phoneTrimmed,
    });
    if (staffErr) return { error: staffErr.message };
    await admin.from('platform_roles').upsert({ user_id: found.id, role: platformRole }, { onConflict: 'user_id' });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantagfleet.com';
    const loginUrl = `${appUrl}/login`;
    const { subject, text, html } = getWelcomeToTeamEmail(loginUrl, tempPassword, role, { name: fullName, isVantagStaff: true });
    const sent = await sendEmail({
      to: trimmed,
      department: 'APP_NOTIFICATION_SUPPORT',
      subject,
      text,
      html,
    });
    if ('error' in sent) {
      return { error: `User created and added to team, but welcome email failed: ${sent.error}. Share this temporary password securely: ${tempPassword}` };
    }
    return { ok: true };
  }

  const platformRole = toPlatformRole(role);
  const { data: existing } = await admin.from('vantag_staff').select('id').eq('user_id', found.id).maybeSingle();
  if (existing) {
    const { error: updateErr } = await admin.from('vantag_staff').update({ role, full_name: fullName, phone: phoneTrimmed }).eq('user_id', found.id);
    if (updateErr) return { error: updateErr.message };
  } else {
    const { error: insertErr } = await admin.from('vantag_staff').insert({
      id: found.id,
      user_id: found.id,
      role,
      full_name: fullName,
      phone: phoneTrimmed,
    });
    if (insertErr) return { error: insertErr.message };
  }

  await admin
    .from('platform_roles')
    .upsert({ user_id: found.id, role: platformRole }, { onConflict: 'user_id' });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantagfleet.com';
  const loginUrl = `${appUrl}/login`;
  const { subject, text, html } = getAddedToTeamEmail(loginUrl, role, { name: fullName, isVantagStaff: true });
  await sendEmail({
    to: trimmed,
    department: 'APP_NOTIFICATION_SUPPORT',
    subject,
    text,
    html,
  });

  return { ok: true };
}

/** Update a VantagFleet staff member's role (and sync platform_roles). */
export async function updateVantagStaffRole(
  userId: string,
  role: VantagStaffRole
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const validRoles: VantagStaffRole[] = ['Support', 'Sales', 'Manager', 'Admin', 'Billing'];
  if (!validRoles.includes(role)) return { error: 'Invalid role.' };
  const admin = createAdminClient();
  const { error: staffErr } = await admin.from('vantag_staff').update({ role }).eq('user_id', userId);
  if (staffErr) return { error: staffErr.message };
  const platformRole = toPlatformRole(role);
  await admin.from('platform_roles').upsert({ user_id: userId, role: platformRole }, { onConflict: 'user_id' });
  return { ok: true };
}

/** Remove a user from vantag_staff and platform_roles (they lose /admin access but account remains). */
export async function removeVantagStaffMember(userId: string): Promise<{ error?: string }> {
  await requireStaff();
  if (!userId || userId === 'null' || !isValidUuid(userId)) return { error: 'Invalid user ID.' };
  const admin = createAdminClient();
  const { error: staffErr } = await admin.from('vantag_staff').delete().eq('user_id', userId);
  if (staffErr) return { error: staffErr.message };
  await admin.from('platform_roles').delete().eq('user_id', userId);
  return {};
}

/** Reset a user's password. Admin and Support can reset (VantagFleet staff). */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const isAdminUser = await isAdmin(supabase);
  const platformRole = await getPlatformRole(supabase);
  const canReset = isAdminUser || platformRole === 'SUPPORT';
  if (!canReset) return { error: 'Only Admins and Support can reset passwords.' };
  if (!userId || userId === 'null' || !isValidUuid(userId)) return { error: 'Invalid user ID.' };
  const trimmed = newPassword?.trim();
  if (!trimmed || trimmed.length < 8) return { error: 'Password must be at least 8 characters.' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: trimmed });
  if (error) return { error: error.message };
  return { ok: true };
}

/** Permanently delete a user from the system (Auth + remove from platform_roles/vantag_staff). Admin only. */
export async function deleteUserFromSystem(userId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return { error: 'Only Admins can delete users from the system.' };
  if (!userId || userId === 'null' || !isValidUuid(userId)) return { error: 'Invalid user ID.' };

  const admin = createAdminClient();
  await admin.from('vantag_staff').delete().eq('user_id', userId);
  await admin.from('platform_roles').delete().eq('user_id', userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { ok: true };
}
