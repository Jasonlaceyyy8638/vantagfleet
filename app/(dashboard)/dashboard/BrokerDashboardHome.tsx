import { createClient } from '@/lib/supabase/server';
import { DashboardMapSection } from './DashboardMapSection';
import { Package, Truck, TrendingUp, MapPin } from 'lucide-react';

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export async function BrokerDashboardHome({
  orgId,
  mapAccess,
}: {
  orgId: string;
  mapAccess: boolean;
}) {
  const supabase = await createClient();
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '').trim();

  const [{ count: postedCount }, { count: truckCount }, { data: marginRows }] = await Promise.all([
    supabase
      .from('loads')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'available'),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabase
      .from('loads')
      .select('revenue_cents, rate_to_carrier')
      .eq('org_id', orgId)
      .not('rate_to_carrier', 'is', null),
  ]);

  let netMargin = 0;
  for (const row of marginRows ?? []) {
    const rev = (row.revenue_cents ?? 0) / 100;
    const pay = Number(row.rate_to_carrier ?? 0);
    netMargin += rev - pay;
  }

  const freight = postedCount ?? 0;
  const capacity = truckCount ?? 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-cloud-dancer">Dashboard</h1>
        <p className="text-cloud-dancer/70">
          Book of business — posted freight, carrier capacity, and margin at a glance.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#30363d] bg-card p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Package className="size-5 text-transformative-teal" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Available freight</span>
          </div>
          <p className="text-3xl font-bold tabular-nums text-cloud-dancer">{freight}</p>
          <p className="mt-1 text-xs text-cloud-dancer/50">Loads posted (status: available)</p>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-card p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-deep-ink p-2">
              <Truck className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Carrier capacity</span>
          </div>
          <p className="text-3xl font-bold tabular-nums text-cloud-dancer">{capacity}</p>
          <p className="mt-1 text-xs text-cloud-dancer/50">Trucks in your org (network)</p>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-card p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-deep-ink p-2">
              <TrendingUp className="size-5 text-cyber-amber" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Net margin</span>
          </div>
          <p className="text-3xl font-bold tabular-nums text-cyber-amber">{formatMoney(netMargin)}</p>
          <p className="mt-1 text-xs text-cloud-dancer/50">Revenue vs carrier pay (loaded loads)</p>
        </div>
      </div>

      <section className="mb-8" id="live-map">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-cloud-dancer">Active shipments</h2>
        </div>
        <DashboardMapSection mapAccess={mapAccess} mapboxToken={mapboxToken} />
      </section>
    </>
  );
}
