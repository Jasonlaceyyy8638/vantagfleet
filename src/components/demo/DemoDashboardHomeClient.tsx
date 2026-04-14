'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Users,
  Truck,
  MapPin,
  LayoutGrid,
  Landmark,
  X,
  Package,
} from 'lucide-react';
import { computeComplianceScore } from '@/lib/compliance';
import { demoBrokerData, demoCarrierData, demoCarrierSandboxDetails } from '@/src/constants/demoData';
import { DemoMapMock } from '@/components/landing/DemoMapMock';
import { useDemoMode } from '@/src/contexts/DemoModeContext';

type CarrierLoad = (typeof demoCarrierData.loads)[number];

/**
 * Demo dashboard home — data comes from `demoCarrierData` (no Supabase). Production views use the same components with
 * `realDataFromSupabase`.
 */
export function DemoDashboardHomeClient() {
  const { demoRole } = useDemoMode();
  const [loadModal, setLoadModal] = useState<CarrierLoad | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);

  if (demoRole === 'broker') {
    const b = demoBrokerData;
    const demoQs = `?mode=demo&role=${demoRole}`;
    const postedFreightCount = b.postedFreightLoads.length;
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full overflow-x-hidden">
        <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Dashboard</h1>
        <p className="text-cloud-dancer/70 mb-2">
          {b.orgName} — broker sandbox. Tender loads, vet carriers, and run settlement previews from the sidebar.
        </p>
        <p className="text-xs text-cloud-dancer/50 mb-8">{b.complianceVetting}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-card border border-[#30363d] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Package className="size-5 text-transformative-teal" />
              </div>
              <span className="text-sm font-medium text-cloud-dancer/70">Available freight</span>
            </div>
            <p className="text-3xl font-bold text-cloud-dancer tabular-nums">{postedFreightCount}</p>
            <p className="text-xs text-cloud-dancer/50 mt-1">Total posted loads</p>
          </div>
          <div className="rounded-xl bg-card border border-[#30363d] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-deep-ink">
                <Truck className="size-5 text-cloud-dancer/60" />
              </div>
              <span className="text-sm font-medium text-cloud-dancer/70">Carrier capacity</span>
            </div>
            <p className="text-3xl font-bold text-cloud-dancer tabular-nums">{b.availableTrucks}</p>
            <p className="text-xs text-cloud-dancer/50 mt-1">Trucks in network</p>
          </div>
          <div className="rounded-xl bg-card border border-[#30363d] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-deep-ink">
                <TrendingUp className="size-5 text-cyber-amber" />
              </div>
              <span className="text-sm font-medium text-cloud-dancer/70">Net margin</span>
            </div>
            <p className="text-3xl font-bold text-cyber-amber tabular-nums">
              ${b.netMarginWeekly.toLocaleString()}
            </p>
            <p className="text-xs text-cloud-dancer/50 mt-1">Customer rate − carrier pay (demo)</p>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-[#30363d] overflow-hidden bg-card/30">
          <div className="px-5 py-4 border-b border-[#30363d] flex items-center gap-2">
            <MapPin className="size-5 text-cyber-amber" />
            <h2 className="font-semibold text-cloud-dancer">Live map — active shipments</h2>
          </div>
          <div className="p-4">
            <DemoMapMock variant="shipments" />
          </div>
        </section>

        <section className="rounded-xl border border-[#30363d] bg-card/40 p-5 mb-8">
          <h2 className="font-semibold text-cloud-dancer mb-3">Posted freight — awaiting carrier</h2>
          <ul className="divide-y divide-white/10">
            {b.postedFreightLoads.map((l) => (
              <li key={l.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-cyber-amber/90 font-mono">{l.id}</span>
                <span className="text-soft-cloud">
                  {l.origin} → {l.destination}
                </span>
                <span className="text-soft-cloud/70">{l.commodity}</span>
                <span className="text-emerald-400/90">{l.status}</span>
                {l.carrierMc ? (
                  <span className="text-cloud-dancer/60 font-mono text-xs ml-auto">{l.carrierMc}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[#30363d] bg-card/40 p-5">
          <h2 className="font-semibold text-cloud-dancer mb-3">Active broker loads</h2>
          <ul className="divide-y divide-white/10">
            {b.activeLoads.map((l) => (
              <li key={l.id} className="py-3 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-cyber-amber/90 font-mono">#{l.id}</span>
                <span className="text-soft-cloud">
                  {l.origin} → {l.destination}
                </span>
                <span className="text-emerald-400/90">{l.status}</span>
                <span className="text-soft-cloud/70">{l.carrier}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/marketplace${demoQs}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber/15 border border-cyber-amber/40 text-cyber-amber font-semibold text-sm hover:bg-cyber-amber/22"
          >
            Marketplace
          </Link>
          <Link
            href={`/loads${demoQs}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-[#30363d] text-cloud-dancer text-sm font-medium hover:border-cyber-amber/40"
          >
            Active loads
          </Link>
        </div>
      </div>
    );
  }

  const data = demoCarrierData;
  const { drivers, revenue, orgName } = data;
  const { vehicles } = demoCarrierSandboxDetails;
  const demoQs = `?mode=demo&role=${demoRole}`;

  const docCount = 12;
  const score = computeComplianceScore({
    driverCount: drivers.length,
    vehicleCount: vehicles.length,
    docCount,
    expiredCount: 0,
    expiringWithin30Count: 0,
    missingCount: 0,
  });
  const scoreColor =
    score >= 80 ? 'text-transformative-teal' : score >= 50 ? 'text-cyber-amber' : 'text-red-400';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Dashboard</h1>
          <p className="text-cloud-dancer/70">
            {orgName} — interactive demo. Open loads and settlements below or jump to Dispatch from the sidebar.
          </p>
          <p className="text-xs text-cloud-dancer/50 mt-2">
            Demo fleet: {data.assets.trucks} trucks · {data.assets.trailers} trailers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <TrendingUp className="size-5 text-transformative-teal" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Operational health</span>
          </div>
          <p className={`text-3xl font-bold ${scoreColor}`}>{Math.round(score)}</p>
          <p className="text-xs text-cloud-dancer/50 mt-1">Sandbox score — TMS-first preview</p>
        </div>
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-deep-ink">
              <Users className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Drivers</span>
          </div>
          <p className="text-2xl font-bold text-cloud-dancer">{drivers.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-deep-ink">
              <Truck className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Active loads</span>
          </div>
          <p className="text-2xl font-bold text-cloud-dancer">{revenue.active_loads}</p>
        </div>
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-deep-ink">
              <FileCheck className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Weekly revenue (demo)</span>
          </div>
          <p className="text-2xl font-bold text-cyber-amber tabular-nums">${revenue.weekly.toLocaleString()}</p>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-[#30363d] bg-card/40 p-5">
        <h2 className="font-semibold text-cloud-dancer mb-3">Loads</h2>
        <ul className="divide-y divide-white/10 rounded-lg border border-white/10 overflow-hidden">
          {data.loads.map((load) => (
            <li key={load.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-midnight-ink/40">
              <div>
                <p className="text-sm font-mono text-cyber-amber">LL-{2400 + load.id}</p>
                <p className="text-xs text-cloud-dancer/70">
                  {load.origin} → {load.destination} · {load.driver}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-soft-cloud/80">{load.status}</span>
                <button
                  type="button"
                  onClick={() => setLoadModal(load)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-electric-teal/20 text-electric-teal hover:bg-electric-teal/30"
                >
                  View load
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setSettlementOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold text-sm hover:bg-cyber-amber/90"
        >
          Open settlement preview
        </button>
      </section>

      <section className="mb-8 rounded-xl border border-[#30363d] overflow-hidden bg-card/30">
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center gap-2">
          <MapPin className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-cloud-dancer">Fleet map preview</h2>
        </div>
        <div className="p-4">
          <DemoMapMock />
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-[#30363d] bg-card/40 p-5">
        <h2 className="font-semibold text-cloud-dancer mb-3">Jump in</h2>
        <p className="text-sm text-cloud-dancer/70 mb-4">
          Same screens as production — forms open, lists use demo data, and dispatch actions simulate success.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dispatch${demoQs}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber/15 border border-cyber-amber/40 text-cyber-amber font-semibold text-sm hover:bg-cyber-amber/22"
          >
            <LayoutGrid className="size-4" />
            Dispatch Board
          </Link>
          <Link
            href={`/compliance${demoQs}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-[#30363d] text-cloud-dancer text-sm font-medium hover:border-cyber-amber/40"
          >
            <FileCheck className="size-4" />
            Compliance
          </Link>
          <Link
            href={`/settlements${demoQs}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-[#30363d] text-cloud-dancer text-sm font-medium hover:border-cyber-amber/40"
          >
            <Landmark className="size-4" />
            Settlements
          </Link>
        </div>
      </section>

      <section className="rounded-xl bg-card border border-[#30363d] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center gap-2">
          <AlertTriangle className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-cloud-dancer">Alerts — demo</h2>
        </div>
        <div className="px-5 py-8 text-center text-cloud-dancer/50 text-sm">
          No expirations in the next 30 days for this sandbox fleet.
        </div>
      </section>

      {loadModal && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/65"
          role="dialog"
          aria-modal
          aria-labelledby="demo-load-title"
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-midnight-ink shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 id="demo-load-title" className="text-lg font-semibold text-cloud-dancer">
                Load LL-{2400 + loadModal.id}
              </h2>
              <button
                type="button"
                onClick={() => setLoadModal(null)}
                className="p-1 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/5"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <dl className="space-y-2 text-sm text-cloud-dancer/80">
              <div className="flex justify-between gap-4">
                <dt className="text-cloud-dancer/50">Origin</dt>
                <dd>{loadModal.origin}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cloud-dancer/50">Destination</dt>
                <dd>{loadModal.destination}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cloud-dancer/50">Status</dt>
                <dd>{loadModal.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cloud-dancer/50">Driver</dt>
                <dd>{loadModal.driver}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cloud-dancer/50">Linehaul (demo)</dt>
                <dd className="text-cyber-amber font-semibold">${loadModal.rate.toLocaleString()}</dd>
              </div>
            </dl>
            <p className="text-xs text-soft-cloud/45 mt-4">
              Demo data only — no database write. Use Dispatch to simulate creating another load.
            </p>
          </div>
        </div>
      )}

      {settlementOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/65"
          role="dialog"
          aria-modal
          aria-labelledby="demo-settlement-title"
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-midnight-ink shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 id="demo-settlement-title" className="text-lg font-semibold text-cloud-dancer">
                Settlement preview
              </h2>
              <button
                type="button"
                onClick={() => setSettlementOpen(false)}
                className="p-1 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/5"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-cloud-dancer/75 mb-4">
              Weekly rolling total for <span className="text-cyber-amber/90">{orgName}</span> (demo):
            </p>
            <p className="text-3xl font-bold text-cyber-amber tabular-nums mb-2">${revenue.weekly.toLocaleString()}</p>
            <p className="text-xs text-soft-cloud/50">
              {revenue.active_loads} active loads on the board. Production settlements will reconcile linehaul, accessorials,
              and driver pay per load.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
