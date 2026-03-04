'use server';

import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { isExpired, isExpiringWithinDays } from '@/lib/compliance';

const COMPLIANCE_WARN_DAYS = 14; // Red if anything expiring within 14 days

export type FleetStats = {
  revenueCents: number;
  fuelCents: number;
  revenueFormatted: string;
  fuelFormatted: string;
  monthLabel: string;
};

export type DriverRankingRow = {
  driverId: string;
  driverName: string;
  totalRevenueCents: number;
  totalFuelCents: number;
  totalMiles: number;
  profitPerMile: number | null;
  loadCount: number;
};

export type ComplianceHealth = 'green' | 'red';

export type EnterpriseOverviewData = {
  fleetStats: FleetStats;
  driverRanking: DriverRankingRow[];
  complianceHealth: ComplianceHealth;
  isEnterprise: boolean;
};

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function getEnterpriseOverview(): Promise<EnterpriseOverviewData | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return { error: 'No organization selected' };

  const { data: org } = await supabase
    .from('organizations')
    .select('tier, subscription_status')
    .eq('id', orgId)
    .single();

  const tier = (org as { tier?: string | null } | null)?.tier ?? null;
  const isEnterprise =
    tier === 'Enterprise' ||
    (org as { subscription_status?: string | null } | null)?.subscription_status === 'active'; // Show for any active sub if no tier; or require tier === 'Enterprise'

  const { start, end } = getCurrentMonthRange();
  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const { data: loads } = await supabase
    .from('loads')
    .select('id, driver_id, revenue_cents, fuel_cost_cents, loaded_miles, deadhead_miles')
    .eq('org_id', orgId)
    .gte('load_date', start)
    .lte('load_date', end);

  let revenueCents = 0;
  let fuelCents = 0;
  const byDriver: Record<
    string,
    { revenueCents: number; fuelCents: number; totalMiles: number; loadCount: number }
  > = {};

  for (const load of loads ?? []) {
    const rev = Number((load as { revenue_cents?: number }).revenue_cents ?? 0);
    const fuel = Number((load as { fuel_cost_cents?: number }).fuel_cost_cents ?? 0);
    const loaded = Number((load as { loaded_miles?: number }).loaded_miles ?? 0);
    const dead = Number((load as { deadhead_miles?: number }).deadhead_miles ?? 0);
    const miles = loaded + dead;
    revenueCents += rev;
    fuelCents += fuel;
    const did = (load as { driver_id?: string | null }).driver_id;
    if (did) {
      if (!byDriver[did]) byDriver[did] = { revenueCents: 0, fuelCents: 0, totalMiles: 0, loadCount: 0 };
      byDriver[did].revenueCents += rev;
      byDriver[did].fuelCents += fuel;
      byDriver[did].totalMiles += miles;
      byDriver[did].loadCount += 1;
    }
  }

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('org_id', orgId)
    .eq('status', 'active');

  const driverMap = new Map((drivers ?? []).map((d) => [d.id, d.name ?? 'Unknown']));
  const driverRanking: DriverRankingRow[] = Object.entries(byDriver)
    .map(([driverId, agg]) => {
      const totalMiles = agg.totalMiles;
      const profit = agg.revenueCents - agg.fuelCents;
      const profitPerMile = totalMiles > 0 ? profit / 100 / totalMiles : null;
      return {
        driverId,
        driverName: driverMap.get(driverId) ?? 'Unknown',
        totalRevenueCents: agg.revenueCents,
        totalFuelCents: agg.fuelCents,
        totalMiles,
        profitPerMile,
        loadCount: agg.loadCount,
      };
    })
    .sort((a, b) => (b.profitPerMile ?? -1) - (a.profitPerMile ?? -1));

  const driverIds = (drivers ?? []).map((d) => d.id);
  const { data: driversFull } = await supabase
    .from('drivers')
    .select('id, med_card_expiry')
    .eq('org_id', orgId);
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, annual_inspection_due')
    .eq('org_id', orgId);
  const { data: complianceDocs } = await supabase
    .from('compliance_docs')
    .select('id, expiry_date')
    .eq('org_id', orgId);
  const { data: driverDocs } =
    driverIds.length > 0
      ? await supabase
          .from('driver_documents')
          .select('id, expiry_date, document_type')
          .in('driver_id', driverIds)
      : { data: [] };

  let complianceHealth: ComplianceHealth = 'green';
  const check = (dateStr: string | null) => {
    if (!dateStr) {
      complianceHealth = 'red';
      return;
    }
    if (isExpired(dateStr)) complianceHealth = 'red';
    else if (isExpiringWithinDays(dateStr, COMPLIANCE_WARN_DAYS)) complianceHealth = 'red';
  };

  (driversFull ?? []).forEach((d) => check((d as { med_card_expiry?: string | null }).med_card_expiry));
  (vehicles ?? []).forEach((v) => check((v as { annual_inspection_due?: string | null }).annual_inspection_due));
  (complianceDocs ?? []).forEach((c) => check((c as { expiry_date?: string | null }).expiry_date));
  (driverDocs ?? []).forEach((d) => check((d as { expiry_date?: string | null }).expiry_date));

  return {
    fleetStats: {
      revenueCents,
      fuelCents,
      revenueFormatted: `$${(revenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      fuelFormatted: `$${(fuelCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      monthLabel,
    },
    driverRanking,
    complianceHealth,
    isEnterprise: true,
  };
}
