'use client';

import { demoBrokerData, demoCarrierData } from '@/src/constants/demoData';

export function LoadsSandboxView({ role }: { role: 'carrier' | 'broker' }) {
  if (role === 'broker') {
    const { activeLoads, orgName, postedFreightLoads } = demoBrokerData;
    return (
      <div className="space-y-8">
        <p className="text-sm text-cyber-amber/90 border border-cyber-amber/30 rounded-lg px-3 py-2 bg-cyber-amber/5">
          Broker sandbox — {orgName}. Post loads from Dispatch; they appear under Active marketplace.
        </p>
        <div className="rounded-xl border border-white/10 bg-card/40 p-6">
          <h2 className="text-lg font-semibold text-soft-cloud mb-4">Active marketplace</h2>
          <p className="text-xs text-soft-cloud/55 mb-4">
            Same view as Dispatch → marketplace loads (status: available). Demo rows below mirror posted freight.
          </p>
          <ul className="space-y-3">
            {postedFreightLoads.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-white/5 pb-3">
                <span className="text-cyber-amber/90 font-mono">{l.id}</span>
                <span className="text-soft-cloud">
                  {l.origin} → {l.destination}
                </span>
                <span className="text-emerald-400/90">{l.status}</span>
                <span className="text-soft-cloud/70 tabular-nums">
                  Buy cap ${l.carrierPay.toLocaleString()} · Customer ${l.customerRate.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-card/40 p-6">
          <h2 className="text-lg font-semibold text-soft-cloud mb-4">Tendered / in motion</h2>
          <ul className="space-y-3">
            {activeLoads.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-white/5 pb-3">
                <span className="text-cyber-amber/90 font-mono">#{l.id}</span>
                <span className="text-soft-cloud">
                  {l.origin} → {l.destination}
                </span>
                <span className="text-emerald-400/90">{l.status}</span>
                <span className="text-soft-cloud/60">{l.carrier}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-dashed border-white/15 bg-card/30 p-6 text-sm text-soft-cloud/70">
          Unified TMS — IFTA and compliance tools are included in Enterprise / trial; no separate add-on modules.
        </div>
      </div>
    );
  }

  const { loads, orgName, revenue } = demoCarrierData;
  return (
    <div className="space-y-8">
      <p className="text-sm text-cyber-amber/90 border border-cyber-amber/30 rounded-lg px-3 py-2 bg-cyber-amber/5">
        Interactive sandbox — {orgName}. Sample loads and IFTA-style mileage summary (no saves).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-soft-cloud/50">Active loads</p>
          <p className="text-2xl font-bold text-cyber-amber tabular-nums">{revenue.active_loads}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-wider text-soft-cloud/50">This quarter (demo)</p>
          <p className="text-2xl font-bold text-transformative-teal tabular-nums">
            {(revenue.weekly * 4).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-soft-cloud/50 mt-1">Illustrative weekly × 4 — not financial advice.</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-midnight-ink/80 text-left text-soft-cloud/60">
              <th className="px-4 py-3 font-medium">Lane</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Driver</th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-soft-cloud">
                  {l.origin} → {l.destination}
                </td>
                <td className="px-4 py-3 text-emerald-400/90">{l.status}</td>
                <td className="px-4 py-3 text-cyber-amber/90 tabular-nums">
                  {l.rate.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </td>
                <td className="px-4 py-3 text-soft-cloud/80">{l.driver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-dashed border-white/15 bg-card/30 p-6 text-sm text-soft-cloud/70">
        State mileage breakdown and Motive tie-in appear when real loads and segments exist — migration 086 schema.
      </div>
    </div>
  );
}
