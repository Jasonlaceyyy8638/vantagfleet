/**
 * Monthly Fleet Health Summary: data aggregation for the cron email.
 * Uses ELD (Motive/Geotab) and ifta_receipts for the given date range.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getIftaSummary } from '@/lib/motive';
import { getFuelTaxDetails, aggregateFuelTaxByState, type GeotabCredentials } from '@/lib/geotab';

export type FleetHealthSummary = {
  totalMiles: number;
  top3States: { state_code: string; miles: number }[];
  eldSyncHealth: string; // e.g. "98%" or "Last synced: 2 hours ago" or "Pending"
  fuelGallons: number | null;
  fuelVsMilesText: string; // e.g. "1,234 gal · 5.2 MPG" or "No fuel data"
};

/**
 * Fetch fleet health stats for one org for the given month (start/end dates).
 * Tries Motive first, then Geotab. Fuel from ifta_receipts (receipt_date in range).
 */
export async function getFleetHealthForMonth(
  admin: SupabaseClient,
  orgId: string,
  start: string,
  end: string
): Promise<FleetHealthSummary> {
  const out: FleetHealthSummary = {
    totalMiles: 0,
    top3States: [],
    eldSyncHealth: '—',
    fuelGallons: null,
    fuelVsMilesText: 'No fuel data',
  };

  // Mileage: Motive first, then Geotab
  let milesByState: { state_code: string; miles: number }[] = [];
  const motiveResult = await getIftaSummary(orgId, start, end);
  if (!('error' in motiveResult)) {
    out.totalMiles = motiveResult.totalMiles;
    milesByState = motiveResult.milesByState;
  } else {
    const { data: row } = await admin
      .from('carrier_integrations')
      .select('credential')
      .eq('org_id', orgId)
      .eq('provider', 'geotab')
      .maybeSingle();
    const cred = (row as { credential?: string } | null)?.credential
      ? (JSON.parse((row as { credential: string }).credential) as GeotabCredentials)
      : null;
    if (cred?.sessionId) {
      const geotabResult = await getFuelTaxDetails(cred, start, end);
      if (!('error' in geotabResult)) {
        const agg = aggregateFuelTaxByState(geotabResult.details);
        out.totalMiles = agg.totalMiles;
        milesByState = agg.milesByState;
      }
    }
  }

  out.top3States = milesByState
    .sort((a, b) => b.miles - a.miles)
    .slice(0, 3)
    .map((s) => ({ state_code: s.state_code, miles: s.miles }));

  // ELD sync health: use last_synced_at from carrier_integrations (most recent)
  const { data: intRows } = await admin
    .from('carrier_integrations')
    .select('last_synced_at')
    .eq('org_id', orgId)
    .in('provider', ['motive', 'geotab']);
  const lastSyncs = (intRows ?? [])
    .map((r) => (r as { last_synced_at?: string | null }).last_synced_at)
    .filter((d): d is string => d != null && d !== '');
  if (lastSyncs.length > 0) {
    const latest = lastSyncs.reduce((a, b) => (a > b ? a : b));
    const ms = Date.now() - new Date(latest).getTime();
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);
    if (hours < 1) out.eldSyncHealth = 'Last synced: just now';
    else if (hours < 24) out.eldSyncHealth = `Last synced: ${hours}h ago`;
    else out.eldSyncHealth = `Last synced: ${days}d ago`;
  } else {
    out.eldSyncHealth = 'Pending first sync';
  }

  // Fuel: sum gallons from ifta_receipts for profiles in this org where receipt_date in [start, end]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('org_id', orgId);
  const profileIds = (profiles ?? []).map((p) => (p as { id: string }).id).filter(Boolean);
  if (profileIds.length > 0) {
    const { data: receipts } = await admin
      .from('ifta_receipts')
      .select('gallons')
      .in('user_id', profileIds)
      .gte('receipt_date', start)
      .lte('receipt_date', end)
      .in('status', ['processed', 'verified']);
    const totalGallons = (receipts ?? []).reduce((sum, r) => sum + Number((r as { gallons?: number }).gallons ?? 0), 0);
    if (totalGallons > 0) {
      out.fuelGallons = Math.round(totalGallons * 100) / 100;
      const mpg = out.totalMiles > 0 ? out.totalMiles / totalGallons : 0;
      out.fuelVsMilesText =
        `${totalGallons.toLocaleString('en-US', { maximumFractionDigits: 1 })} gal · ${mpg.toFixed(1)} MPG`;
    }
  }

  return out;
}
