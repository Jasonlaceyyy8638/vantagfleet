'use client';

import { useRef } from 'react';
import { ReportIncidentButton } from './ReportIncidentButton';
import { IncidentHistory } from './IncidentHistory';

export function ReportIncidentSection() {
  const refetchRef = useRef<(() => void) | null>(null);

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-3">
        Report Inspection / Incident
      </h2>
      <p className="text-sm text-[#94a3b8] mb-3">
        Log DOT inspections, breakdowns, accidents, or citations. Dispatch will be notified immediately.
      </p>
      <div className="mb-4">
        <ReportIncidentButton onSuccess={() => refetchRef.current?.()} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-[#94a3b8] mb-2">Your reports (last 30 days)</h3>
        <IncidentHistory onRefetchRef={refetchRef} />
      </div>
    </section>
  );
}
