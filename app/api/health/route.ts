import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

const ORG_COOKIE = 'vantag-current-org-id';
const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';

type MotiveCredential = {
  access_token?: string;
  refresh_token?: string | null;
  expires_at?: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ORG_COOKIE)?.value;
  if (!orgId) {
    return NextResponse.json(
      { motive: 'error', motus: 'pending', lastSync: '', motiveError: 'no_org' },
      { status: 200 }
    );
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  if (!orgIds.includes(orgId)) {
    return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
  }

  const admin = createAdminClient();
  let motive: 'online' | 'error' = 'error';
  let motiveError: 'expired' | 'disconnected' | null = null;
  let lastSync = '';

  try {
    const { data: motiveRow } = await admin
      .from('carrier_integrations')
      .select('credential, last_synced_at')
      .eq('org_id', orgId)
      .eq('provider', 'motive')
      .maybeSingle();

    if (motiveRow?.last_synced_at) {
      lastSync = new Date(motiveRow.last_synced_at).toISOString();
    }

    if (motiveRow?.credential) {
      const cred = JSON.parse(motiveRow.credential) as MotiveCredential;
      const token = cred.access_token || null;
      if (cred.expires_at != null && cred.expires_at * 1000 < Date.now()) {
        motive = 'error';
        motiveError = 'expired';
      } else if (token) {
        const res = await fetch(`${MOTIVE_API_BASE}/company`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          motive = 'online';
          motiveError = null;
        } else {
          motive = 'error';
          motiveError = res.status === 401 ? 'expired' : 'disconnected';
        }
      } else {
        motiveError = 'disconnected';
      }
    } else {
      motiveError = 'disconnected';
    }
  } catch {
    motive = 'error';
    motiveError = 'disconnected';
  }

  let motus: 'pending' | 'online' = 'pending';
  try {
    const { data: motusRow } = await admin
      .from('carrier_integrations')
      .select('credential')
      .eq('org_id', orgId)
      .eq('provider', 'motus')
      .maybeSingle();
    if (motusRow?.credential) {
      const parsed = JSON.parse(motusRow.credential) as { loginId?: string };
      if (parsed?.loginId) motus = 'online';
    }
  } catch {
    // leave motus as pending
  }

  return NextResponse.json({
    motive,
    motus,
    lastSync,
    ...(motiveError && { motiveError }),
  });
}
