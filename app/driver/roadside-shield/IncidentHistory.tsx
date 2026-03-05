'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { IncidentReport } from './ReportIncidentButton';

export function IncidentHistory({ onRefetchRef }: { onRefetchRef?: React.MutableRefObject<(() => void) | null> }) {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(() => {
    setLoading(true);
    fetch('/api/driver/roadside-incident')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.reports)) setReports(data.reports);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (onRefetchRef) onRefetchRef.current = fetchReports;
  }, [onRefetchRef, fetchReports]);

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[#94a3b8]">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading history…
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-sm text-[#94a3b8] py-2">No reports in the last 30 days.</p>
    );
  }

  return (
    <ul className="space-y-3 list-none p-0 m-0">
      {reports.map((r) => (
        <li key={r.id} className="rounded-xl border border-white/10 bg-[#1e293b] p-4">
          <div className="flex items-start gap-2">
            <FileText className="size-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{r.incident_type}</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                {new Date(r.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              {r.notes && <p className="text-sm text-[#cbd5e1] mt-2">{r.notes}</p>}
              {r.latitude != null && r.longitude != null && (
                <p className="text-xs text-[#64748b] mt-1">
                  {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
