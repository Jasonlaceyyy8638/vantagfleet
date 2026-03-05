import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';

export type SystemStatus = 'live' | 'syncing' | 'error';

/**
 * Returns system status and last fleet sync time from ELD integrations (Motive/Geotab).
 * Uses last_synced_at from carrier_integrations for the user's current org.
 */
export async function GET() {
  const status: SystemStatus = 'live';
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
    const dates = (rows ?? [])
      .map((r) => (r as { last_synced_at?: string | null }).last_synced_at)
      .filter((d): d is string => d != null && d !== '');
    if (dates.length > 0) {
      const max = dates.reduce((a, b) => (a > b ? a : b));
      lastSyncedAt = max;
    }
  }

  return NextResponse.json({ status, lastSyncedAt });
}
