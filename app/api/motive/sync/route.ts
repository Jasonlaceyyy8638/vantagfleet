import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { runMotiveSyncCore } from '@/lib/motive-sync-core';
import { getDashboardOrgId, canImpersonateCarrier, IMPERSONATE_COOKIE } from '@/lib/admin';

/**
 * POST /api/motive/sync
 * Syncs Motive vehicles and users into public.vehicles and public.drivers for the current user's org.
 * Uses org_id from cookie (vantag-current-org-id). Updates last_synced_at on carrier_integrations.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return NextResponse.json({ error: 'No organization selected' }, { status: 400 });
  }

  const impersonating = cookieStore.get(IMPERSONATE_COOKIE)?.value === orgId && (await canImpersonateCarrier(supabase));
  if (!impersonating) {
    const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
    const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
    if (!orgIds.includes(orgId)) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 });
    }
  }

  const result = await runMotiveSyncCore(orgId);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  let lastSyncedAt = new Date().toISOString();
  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('carrier_integrations')
      .select('last_synced_at')
      .eq('org_id', orgId)
      .eq('provider', 'motive')
      .maybeSingle();
    if (row?.last_synced_at) lastSyncedAt = row.last_synced_at;
  } catch {
    // use default
  }

  return NextResponse.json({
    ok: true,
    vehicles: result.vehicles,
    drivers: result.drivers,
    last_synced_at: lastSyncedAt,
  });
}
