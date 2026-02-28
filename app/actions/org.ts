'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ORG_COOKIE = 'vantag-current-org-id';

export async function setCurrentOrg(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  redirect('/dashboard');
}

export async function createInviteLink(orgId: string): Promise<{ link: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { link: '', error: 'Not authenticated' };
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const { error } = await supabase.from('org_invites').insert({
    org_id: orgId,
    token,
    created_by: user.id,
  });
  if (error) return { link: '', error: error.message };
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return { link: `${base}/invite?token=${token}` };
}

export async function acceptInvite(token: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: inviteRows } = await supabase.rpc('get_invite_by_token', { invite_token: token });
  const row = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows;
  if (!row?.org_id) return { error: 'Invalid or expired invite' };
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').insert({
    user_id: user.id,
    org_id: row.org_id,
    role: 'Driver',
    full_name: null,
  });
  if (error) return { error: error.message };
  redirect('/dashboard');
}
