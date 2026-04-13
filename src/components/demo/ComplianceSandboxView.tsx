'use client';

import { demoBrokerData, demoCarrierData, demoSafetyReports } from '@/src/constants/demoData';
import { useDemoMode } from '@/src/contexts/DemoModeContext';
import { FileCheck } from 'lucide-react';

/** Compliance overview for unauthenticated demo — fleet + safety reports. */
export function ComplianceSandboxView() {
  const { demoRole } = useDemoMode();
  const { drivers, orgName } = demoRole === 'broker' ? { drivers: demoBrokerData.activeLoads.map((l) => ({ name: l.carrier, status: 'Active', compliance: 'Verified', hos: '—' })), orgName: demoBrokerData.orgName } : { drivers: demoCarrierData.drivers, orgName: demoCarrierData.orgName };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Compliance</h1>
      <p className="text-soft-cloud/70 mb-6">
        Demo sandbox for <span className="text-cyber-amber/90">{orgName}</span> — fleet status and safety reporting preview. In production, COI uploads and AI extraction run here.
      </p>
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-6">
        <p className="text-sm text-emerald-300/95 flex items-center gap-2">
          <FileCheck className="size-4 shrink-0" />
          {demoRole === 'broker' ? 'Broker vetting matches your tendered network.' : 'Demo drivers below match your live dispatch board.'}
        </p>
      </div>

      <h2 className="text-sm font-semibold text-soft-cloud mb-3">Safety &amp; compliance reports</h2>
      <ul className="space-y-2 mb-8">
        {demoSafetyReports.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-card/40 px-4 py-3 text-sm"
          >
            <span className="font-medium text-soft-cloud">{r.title}</span>
            <span className="text-xs text-soft-cloud/60">
              {r.severity.toUpperCase()} · {r.status} · opened {r.openedAt}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-sm font-semibold text-soft-cloud mb-3">{demoRole === 'broker' ? 'Carriers' : 'Drivers'}</h2>
      <ul className="space-y-2">
        {drivers.map((d) => (
          <li
            key={d.name}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-card/40 px-4 py-3 text-sm"
          >
            <span className="font-medium text-soft-cloud">{d.name}</span>
            <span className="text-cloud-dancer/60 text-xs">
              {d.status} · {d.compliance} · HOS {d.hos}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
