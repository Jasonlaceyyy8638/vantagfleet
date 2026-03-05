'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';
import { getDispatcherInviteEmail, getDriverInviteEmail } from '@/lib/invite-email';

const ORG_COOKIE = 'vantag-current-org-id';

export async function setCurrentOrg(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  redirect('/dashboard');
}

export async function createInviteLink(
  orgId: string,
  role: 'Driver' | 'Dispatcher' = 'Driver',
  email?: string | null
): Promise<{ link: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { link: '', error: 'Not authenticated' };
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const { error } = await supabase.from('org_invites').insert({
    org_id: orgId,
    token,
    created_by: user.id,
    invite_role: role,
    ...(email?.trim() ? { email: email.trim() } : {}),
  });
  if (error) return { link: '', error: error.message };
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const link = `${base}/invite?token=${token}`;

  const toEmail = email?.trim();
  if (toEmail) {
    const { data: org } = await supabase.from('organizations').select('name').eq('id', orgId).single();
    const companyName = (org as { name?: string } | null)?.name ?? 'your fleet';

    if (role === 'Dispatcher') {
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

/** Update a member's role (Owner only). Allowed: Driver, Dispatcher. Cannot demote the only Owner. */
export async function updateMemberRole(
  orgId: string,
  profileId: string,
  newRole: 'Owner' | 'Dispatcher' | 'Driver'
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const me = myProfile as { id?: string; role?: string } | null;
  if (!me || (me.role !== 'Owner' && me.role !== 'Safety_Manager')) return { error: 'Only org owners can change roles' };
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

export async function acceptInvite(token: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: inviteRows } = await supabase.rpc('get_invite_by_token', { invite_token: token });
  const row = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows;
  if (!row?.org_id) return { error: 'Invalid or expired invite' };
  const inviteRole = (row as { invite_role?: string }).invite_role;
  const profileRole = inviteRole === 'Dispatcher' ? 'Dispatcher' : 'Driver';
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
  if (profileRole === 'Dispatcher') redirect('/dashboard/map');
  redirect('/mobile/fuel-upload');
}
