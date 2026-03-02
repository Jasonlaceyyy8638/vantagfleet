'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId, isSuperAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';

/** Get messages for the current user's org (carrier) or for a given org (admin). */
export async function getSupportMessages(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const cookieStore = await cookies();
  const isAdminUser = await isSuperAdmin(supabase);
  const dashboardOrgId = await getDashboardOrgId(supabase, cookieStore);

  if (isAdminUser) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('support_messages')
      .select('id, sender_id, receiver_id, org_id, content, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });
    return (data ?? []) as { id: string; sender_id: string; receiver_id: string | null; org_id: string; content: string; created_at: string }[];
  }

  if (orgId !== dashboardOrgId) return [];
  const { data } = await supabase
    .from('support_messages')
    .select('id, sender_id, receiver_id, org_id, content, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });
  return (data ?? []) as { id: string; sender_id: string; receiver_id: string | null; org_id: string; content: string; created_at: string }[];
}

/** Send a message. Carrier: receiverId null. Admin: pass receiverId (carrier user). */
export async function sendSupportMessage(
  orgId: string,
  content: string,
  receiverId: string | null
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const trimmed = content?.trim();
  if (!trimmed) return { error: 'Message is required' };

  const cookieStore = await cookies();
  const isAdminUser = await isSuperAdmin(supabase);
  const dashboardOrgId = await getDashboardOrgId(supabase, cookieStore);

  if (isAdminUser) {
    const admin = createAdminClient();
    const { error } = await admin.from('support_messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      org_id: orgId,
      content: trimmed,
    });
    if (error) return { error: error.message };
    return { ok: true };
  }

  if (orgId !== dashboardOrgId) return { error: 'Access denied' };
  const { error } = await supabase.from('support_messages').insert({
    sender_id: user.id,
    receiver_id: null,
    org_id: orgId,
    content: trimmed,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/** Admin only: list conversations (orgs with at least one message) with last message preview. */
export async function getSupportConversations(): Promise<{ org_id: string; org_name: string; last_at: string; last_preview: string | null }[]> {
  const supabase = await createClient();
  const isAdminUser = await isSuperAdmin(supabase);
  if (!isAdminUser) return [];

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('support_messages')
    .select('org_id, content, created_at')
    .order('created_at', { ascending: false });

  if (!rows?.length) return [];

  const orgIds = Array.from(new Set(rows.map((r) => r.org_id)));
  const { data: orgs } = await admin.from('organizations').select('id, name').in('id', orgIds);
  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name ?? '—']));

  const byOrg = new Map<string, { last_at: string; last_preview: string }>();
  for (const r of rows) {
    if (!byOrg.has(r.org_id)) {
      byOrg.set(r.org_id, { last_at: r.created_at, last_preview: (r.content ?? '').slice(0, 60) });
    }
  }

  return Array.from(byOrg.entries())
    .map(([org_id, { last_at, last_preview }]) => ({
      org_id,
      org_name: nameById.get(org_id) ?? '—',
      last_at,
      last_preview,
    }))
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
}
