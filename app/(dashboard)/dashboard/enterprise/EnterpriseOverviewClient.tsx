'use client';

import { Shield, TrendingUp, Users, DollarSign, Fuel } from 'lucide-react';
import type { FleetStats, DriverRankingRow, ComplianceHealth } from '@/app/actions/enterprise-overview';

export function EnterpriseOverviewClient({
  fleetStats,
  driverRanking,
  complianceHealth,
}: {
  fleetStats: FleetStats;
  driverRanking: DriverRankingRow[];
  complianceHealth: ComplianceHealth;
}) {
  const shieldColor = complianceHealth === 'green' ? 'text-emerald-500' : 'text-red-500';
  const shieldBg = complianceHealth === 'green' ? 'bg-emerald-500/20' : 'bg-red-500/20';

  return (
    <div className="space-y-8">
      {/* Fleet Stats: Revenue vs Fuel */}
      <section className="rounded-xl bg-card border border-[#30363d] p-6">
        <h2 className="text-lg font-semibold text-cloud-dancer mb-4 flex items-center gap-2">
          <DollarSign className="size-5 text-cyber-amber" />
          Fleet stats — {fleetStats.monthLabel}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-lg bg-deep-ink/50 border border-[#30363d] p-4">
            <div className="flex items-center gap-2 text-cloud-dancer/70 text-sm mb-1">
              <TrendingUp className="size-4" />
              Total revenue
            </div>
            <p className="text-2xl font-bold text-transformative-teal">{fleetStats.revenueFormatted}</p>
          </div>
          <div className="rounded-lg bg-deep-ink/50 border border-[#30363d] p-4">
            <div className="flex items-center gap-2 text-cloud-dancer/70 text-sm mb-1">
              <Fuel className="size-4" />
              Total fuel spend
            </div>
            <p className="text-2xl font-bold text-cyber-amber">{fleetStats.fuelFormatted}</p>
          </div>
        </div>
      </section>

      {/* Driver Ranking by Profit Per Mile */}
      <section className="rounded-xl bg-card border border-[#30363d] overflow-hidden">
        <h2 className="text-lg font-semibold text-cloud-dancer px-6 py-4 border-b border-[#30363d] flex items-center gap-2">
          <Users className="size-5 text-cyber-amber" />
          Driver ranking — profit per mile
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#30363d] bg-deep-ink/30">
                <th className="px-6 py-3 text-xs font-medium text-cloud-dancer/70 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-xs font-medium text-cloud-dancer/70 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-xs font-medium text-cloud-dancer/70 uppercase tracking-wider">Loads</th>
                <th className="px-6 py-3 text-xs font-medium text-cloud-dancer/70 uppercase tracking-wider">Miles</th>
                <th className="px-6 py-3 text-xs font-medium text-cloud-dancer/70 uppercase tracking-wider">Profit/mi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {driverRanking.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-cloud-dancer/50">
                    No load data this month. Add loads with driver assignments to see rankings.
                  </td>
                </tr>
              ) : (
                driverRanking.map((row, i) => (
                  <tr key={row.driverId} className="hover:bg-deep-ink/20">
                    <td className="px-6 py-3 text-cloud-dancer/70 font-medium">{i + 1}</td>
                    <td className="px-6 py-3 text-cloud-dancer font-medium">{row.driverName}</td>
                    <td className="px-6 py-3 text-cloud-dancer/80">{row.loadCount}</td>
                    <td className="px-6 py-3 text-cloud-dancer/80">{row.totalMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-6 py-3">
                      {row.profitPerMile != null ? (
                        <span className={row.profitPerMile >= 0 ? 'text-transformative-teal font-medium' : 'text-red-400'}>
                          ${row.profitPerMile.toFixed(2)}/mi
                        </span>
                      ) : (
                        <span className="text-cloud-dancer/50">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Compliance Health Shield */}
      <section className="rounded-xl bg-card border border-[#30363d] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${shieldBg}`}>
            <Shield className={`size-8 ${shieldColor}`} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cloud-dancer">Compliance health</h2>
            <p className="text-sm text-cloud-dancer/70 mt-0.5">
              {complianceHealth === 'green'
                ? 'All HOS logs and insurance docs are valid. Nothing expiring soon.'
                : 'Something is expired or expiring within 14 days. Review drivers, vehicles, and documents.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${complianceHealth === 'green' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`size-2 rounded-full ${complianceHealth === 'green' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {complianceHealth === 'green' ? 'All clear' : 'Needs attention'}
          </span>
        </div>
      </section>
    </div>
  );
}
