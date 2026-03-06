'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';
import { getDispatcherInviteEmail, getDriverInviteEmail, getWelcomeToTeamEmail, getAddedToTeamEmail } from '@/lib/invite-email';
import { randomBytes } from 'crypto';
import { canImpersonateCarrier, isAdmin } from '@/lib/admin';

const ORG_COOKIE = 'vantag-current-org-id';

export async function setCurrentOrg(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  redirect('/dashboard');
}

/** True if the current user has full control over any carrier (Admin/Support impersonating or app owner). */
async function hasFullCarrierControl(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  if (await isAdmin(supabase)) return true;
  return canImpersonateCarrier(supabase);
}

export async function createInviteLink(
  orgId: string,
  role: 'Driver' | 'Dispatcher' | 'Safety_Manager' | 'Driver_Manager' = 'Driver',
  email?: string | null
): Promise<{ link: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { link: '', error: 'Not authenticated' };

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const payload = {
    org_id: orgId,
    token,
    created_by: user.id,
    invite_role: role,
    ...(email?.trim() ? { email: email.trim() } : {}),
  };

  const isStaffWithControl = await hasFullCarrierControl(supabase);
  if (isStaffWithControl) {
    const admin = createAdminClient();
    const { error } = await admin.from('org_invites').insert(payload);
    if (error) return { link: '', error: error.message };
  } else {
    const { error } = await supabase.from('org_invites').insert(payload);
    if (error) return { link: '', error: error.message };
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const link = `${base}/invite?token=${token}`;

  const toEmail = email?.trim();
  if (toEmail) {
    const client = isStaffWithControl ? createAdminClient() : supabase;
    const { data: org } = await client.from('organizations').select('name').eq('id', orgId).single();
    const companyName = (org as { name?: string } | null)?.name ?? 'your fleet';

    if (role === 'Dispatcher' || role === 'Safety_Manager' || role === 'Driver_Manager') {
      const { subject, text, html } = getDispatcherInviteEmail(link, companyName);
      await sendEmail({
        to: toEmail,
        department: 'APP_NOTIFICATION_SUPPORT',
        subject,
        text,
        html,
      });
    } else {
      const { subject, text, html } = getDriverInviteEmail(link, companyName);
      await sendEmail({
        to: toEmail,
        department: 'APP_NOTIFICATION_SUPPORT',
        subject,
        text,
        html,
      });
    }
  }

  return { link };
}

/** Update a member's role. Allowed: Owner, Admin, Safety_Manager, or VantagFleet Admin/Support with full carrier control. Cannot demote the only Owner. */
export async function updateMemberRole(
  orgId: string,
  profileId: string,
  newRole: 'Owner' | 'Admin' | 'Safety_Manager' | 'Driver_Manager' | 'Dispatcher' | 'Driver'
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const hasControl = await hasFullCarrierControl(supabase);
  if (!hasControl) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();
    const me = myProfile as { id?: string; role?: string } | null;
    if (!me || (me.role !== 'Owner' && me.role !== 'Admin' && me.role !== 'Safety_Manager')) return { error: 'Only org owners, admins, or safety managers can change roles' };
  }
  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('id, role').eq('id', profileId).eq('org_id', orgId).single();
  if (!target) return { error: 'Member not found' };
  const currentRole = (target as { role?: string }).role;
  if (currentRole === 'Owner' && newRole !== 'Owner') {
    const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('role', 'Owner');
    if ((count ?? 0) <= 1) return { error: 'Cannot demote the only Owner. Transfer ownership first.' };
  }
  const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', profileId).eq('org_id', orgId);
  if (error) return { error: error.message };
  return {};
}

/** Add a team member by email with role. Name and phone are required. If they don't have an account, one is created and a welcome email with temporary password and logo is sent. Uses SendGrid (SENDGRID_API_KEY); if missing, new-user flow returns an error with the temp password to share. Allowed: org Owner/Admin/Safety_Manager or VantagFleet Admin/Support with full carrier control. */
export async function addOrgMemberByEmail(
  orgId: string,
  email: string,
  role: 'Admin' | 'Safety_Manager' | 'Driver_Manager' | 'Dispatcher' | 'Driver',
  name: string,
  phone: string
): Promise<{ ok: true; warning?: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const hasControl = await hasFullCarrierControl(supabase);
  if (!hasControl) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();
    const me = myProfile as { role?: string } | null;
    if (!me || (me.role !== 'Owner' && me.role !== 'Admin' && me.role !== 'Safety_Manager')) return { error: 'Only org owners, admins, or safety managers can add team members by email.' };
  }

  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required.' };
  const fullName = name?.trim();
  if (!fullName) return { error: 'Full name is required.' };
  const phoneTrimmed = phone?.trim();
  if (!phoneTrimmed) return { error: 'Phone number is required.' };

  const admin = createAdminClient();
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { error: listError.message };

  let found = users?.find((u) => u.email?.toLowerCase() === trimmed);
  let isNewUser = false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantagfleet.com';
  const loginUrl = `${appUrl}/login`;

  if (!found) {
    isNewUser = true;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const tempPassword = Array.from({ length: 12 }, () => chars[randomBytes(1)[0]! % chars.length]).join('');
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: trimmed,
      password: tempPassword,
      email_confirm: true,
    });
    if (createError) return { error: createError.message };
    if (!newUser.user) return { error: 'Failed to create user.' };
    found = newUser.user;

    const { data: org } = await admin.from('organizations').select('name').eq('id', orgId).single();
    const companyName = (org as { name?: string } | null)?.name ?? 'your fleet';
    const { subject, text, html } = getWelcomeToTeamEmail(loginUrl, tempPassword, role, { name: fullName, companyName, isVantagStaff: false });
    const sent = await sendEmail({
      to: trimmed,
      department: 'APP_NOTIFICATION_SUPPORT',
      subject,
      text,
      html,
    });
    if ('error' in sent) {
      return { error: `Account created but welcome email failed: ${sent.error}. Share this temporary password securely: ${tempPassword}` };
    }
  }

  const { error: insertError } = await admin.from('profiles').insert({
    id: found.id,
    user_id: found.id,
    org_id: orgId,
    role,
    full_name: fullName,
    phone: phoneTrimmed,
  });
  if (insertError) {
    if (insertError.code === '23505') return { error: 'This person is already in your organization.' };
    return { error: insertError.message };
  }

  let emailWarning: string | undefined;
  if (!isNewUser) {
    const { data: org } = await admin.from('organizations').select('name').eq('id', orgId).single();
    const companyName = (org as { name?: string } | null)?.name ?? 'your fleet';
    const { subject, text, html } = getAddedToTeamEmail(loginUrl, role, { name: fullName, isVantagStaff: false });
    const sent = await sendEmail({
      to: trimmed,
      department: 'APP_NOTIFICATION_SUPPORT',
      subject: `You've been added to ${companyName}`,
      text: text.replace('You\'ve been added to the team', `You've been added to ${companyName}`),
      html,
    });
    if ('error' in sent) {
      emailWarning = `Notification email could not be sent (${sent.error}). Share this sign-in link with them: ${loginUrl}`;
    }
  }

  return { ok: true, warning: emailWarning };
}

export async function acceptInvite(token: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: inviteRows } = await supabase.rpc('get_invite_by_token', { invite_token: token });
  const row = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows;
  if (!row?.org_id) return { error: 'Invalid or expired invite' };
  const inviteRole = (row as { invite_role?: string }).invite_role;
  const profileRole = ['Dispatcher', 'Safety_Manager', 'Driver_Manager'].includes(inviteRole ?? '') ? inviteRole! : 'Driver';
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Service is temporarily unavailable. Please try again later.' };
  }
  const { error } = await admin.from('profiles').insert({
    user_id: user.id,
    org_id: row.org_id,
    role: profileRole,
    full_name: null,
  });
  if (error) return { error: error.message };
  if (profileRole !== 'Driver') redirect('/dashboard');
  redirect('/mobile/fuel-upload');
}
