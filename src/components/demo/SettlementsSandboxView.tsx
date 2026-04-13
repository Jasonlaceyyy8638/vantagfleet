'use client';

import { demoAccountingData, demoBrokerData, demoBrokerSettlements } from '@/src/constants/demoData';
import { useDemoMode } from '@/src/contexts/DemoModeContext';

/** Accounting / settlements preview for unauthenticated demo — role-aware. */
export function SettlementsSandboxView() {
  const { demoRole } = useDemoMode();

  if (demoRole === 'carrier') {
    const rows = demoAccountingData.settlements;
    const paid = rows.filter((r) => r.status === 'Paid');
    const pending = rows.filter((r) => r.status === 'Pending');
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Settlements</h1>
        <p className="text-cloud-dancer/70 mb-6">
          <span className="text-cyber-amber/90 font-medium">Carrier sandbox</span> — sample driver settlements from{' '}
          <code className="text-cyber-amber/80">demoAccountingData</code> (demo).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cloud-dancer/50">Paid</p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{paid.length}</p>
          </div>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cloud-dancer/50">Pending</p>
            <p className="text-2xl font-bold text-amber-300 tabular-nums">{pending.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-midnight-ink/80 text-left text-cloud-dancer/60">
                <th className="px-4 py-3 font-medium">Settlement</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium text-right">Loads</th>
                <th className="px-4 py-3 font-medium text-right">Gross</th>
                <th className="px-4 py-3 font-medium text-right">Fuel ded.</th>
                <th className="px-4 py-3 font-medium text-right">Net pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-cyber-amber/90">{row.id}</td>
                  <td className="px-4 py-3 text-soft-cloud/90">{row.date}</td>
                  <td className="px-4 py-3 text-soft-cloud">{row.driver}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-soft-cloud">{row.load_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-soft-cloud">
                    {row.gross.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-soft-cloud/80">
                    {row.fuel_deduction.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-300/95">
                    {row.net_pay.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'Paid' ? (
                      <span className="text-emerald-400/90">Paid</span>
                    ) : (
                      <span className="text-amber-300/90">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const { orgName, availableTrucks, activeLoads, complianceVetting } = demoBrokerData;
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Settlements</h1>
      <p className="text-cloud-dancer/70 mb-2">
        <span className="text-cyber-amber/90 font-medium">{orgName}</span> — sample broker desk. Production ties tendered loads to carrier pay and settlement batches.
      </p>
      <p className="text-sm text-emerald-400/90 mb-6 border border-emerald-500/25 rounded-lg px-3 py-2 bg-emerald-500/5">
        {complianceVetting}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-white/10 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-cloud-dancer/50">Available capacity</p>
          <p className="text-3xl font-bold text-cyber-amber tabular-nums">{availableTrucks}</p>
          <p className="text-xs text-cloud-dancer/60 mt-1">Verified trucks on the network (demo)</p>
        </div>
      </div>
      <h2 className="text-sm font-semibold text-cloud-dancer mb-3">Broker settlement lines</h2>
      <div className="rounded-xl border border-white/10 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-midnight-ink/80 text-left text-cloud-dancer/60">
              <th className="px-4 py-3 font-medium">Batch</th>
              <th className="px-4 py-3 font-medium">Carrier</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {demoBrokerSettlements.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-mono text-cyber-amber/90">{row.batch}</td>
                <td className="px-4 py-3 text-soft-cloud">{row.carrierOrDriver}</td>
                <td className="px-4 py-3 tabular-nums">{row.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td className="px-4 py-3">{row.status === 'paid' ? <span className="text-emerald-400/90">Paid</span> : <span className="text-amber-300/90">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-sm font-semibold text-cloud-dancer mb-3">Active broker loads</h2>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-midnight-ink/80 text-left text-cloud-dancer/60">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Lane</th>
              <th className="px-4 py-3 font-medium">Carrier</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeLoads.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-mono text-cyber-amber/90">#{row.id}</td>
                <td className="px-4 py-3 text-soft-cloud">
                  {row.origin} → {row.destination}
                </td>
                <td className="px-4 py-3 text-cloud-dancer/80">{row.carrier}</td>
                <td className="px-4 py-3 text-emerald-400/90">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
