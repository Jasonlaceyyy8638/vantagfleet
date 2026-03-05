import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';

export type SystemStatus = 'live' | 'syncing' | 'error' | 'no_eld';

/**
 * Returns system status and last fleet sync time from ELD integrations (Motive/Geotab).
 * status 'no_eld' when no active ELD connection; 'live' when connected.
 */
export async function GET() {
  let status: SystemStatus = 'no_eld';
  let lastSyncedAt: string | null = null;

  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (orgId) {
    const { data: rows } = await supabase
      .from('carrier_integrations')
      .select('last_synced_at')
      .eq('org_id', orgId)
      .in('provider', ['motive', 'geotab']);
    const list = rows ?? [];
    if (list.length > 0) {
      status = 'live';
      const dates = list
        .map((r) => (r as { last_synced_at?: string | null }).last_synced_at)
        .filter((d): d is string => d != null && d !== '');
      if (dates.length > 0) {
        lastSyncedAt = dates.reduce((a, b) => (a > b ? a : b));
      }
    }
  }

  return NextResponse.json({ status, lastSyncedAt });
}
