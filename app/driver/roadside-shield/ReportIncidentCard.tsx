'use client';

import { useRef } from 'react';
import { ReportIncidentButton } from './ReportIncidentButton';
import { IncidentHistory } from './IncidentHistory';

export function ReportIncidentCard() {
  const refetchRef = useRef<(() => void) | null>(null);

  return (
    <>
      <ReportIncidentButton onSuccess={() => refetchRef.current?.()} />
      <div className="mt-3">
        <p className="text-xs text-[#94a3b8] mb-2">Your reports (last 30 days)</p>
        <IncidentHistory onRefetchRef={refetchRef} />
      </div>
    </>
  );
}
