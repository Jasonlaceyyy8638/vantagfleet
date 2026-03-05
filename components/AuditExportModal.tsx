'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, FileArchive, Loader2 } from 'lucide-react';
import { DataVerificationModal } from '@/components/DataVerificationModal';

const QUARTERS = [
  { q: 1 as const, label: 'Q1 (Jan–Mar)' },
  { q: 2 as const, label: 'Q2 (Apr–Jun)' },
  { q: 3 as const, label: 'Q3 (Jul–Sep)' },
  { q: 4 as const, label: 'Q4 (Oct–Dec)' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-select this quarter when opening (e.g. current dashboard quarter) */
  defaultQuarter?: 1 | 2 | 3 | 4;
  defaultYear?: number;
};

export function AuditExportModal({
  open,
  onClose,
  defaultQuarter = 1,
  defaultYear = CURRENT_YEAR,
}: Props) {
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(defaultQuarter);
  const [year, setYear] = useState(defaultYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setQuarter(defaultQuarter);
      setYear(defaultYear);
      setError(null);
      setVerificationOpen(false);
    }
  }, [open, defaultQuarter, defaultYear]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/ifta/audit-export?quarter=${quarter}&year=${year}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Failed to generate audit export.');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : `VantagFleet_Audit_Q${quarter}_${year}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setVerificationOpen(false);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quarter, year, onClose]);

  const handleContinueToVerification = useCallback(() => {
    setError(null);
    setVerificationOpen(true);
  }, []);

  const handleVerificationConfirm = useCallback(() => {
    setVerificationOpen(false);
    handleGenerate();
  }, [handleGenerate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-export-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="audit-export-title" className="text-lg font-semibold text-soft-cloud flex items-center gap-2">
            <FileArchive className="size-5 text-cyber-amber" aria-hidden />
            Generate Audit Export
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-soft-cloud/80">
            Create a ZIP bundle with a Summary Report (State, Taxable Miles, Fuel Purchases) and a Detailed Trip Log (state line crossings). Ideal for audits.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="audit-quarter" className="block text-xs font-medium text-soft-cloud/70 mb-1.5">
                Quarter
              </label>
              <select
                id="audit-quarter"
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-midnight-ink px-3 py-2 text-sm text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber disabled:opacity-50"
              >
                {QUARTERS.map(({ q, label }) => (
                  <option key={q} value={q}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audit-year" className="block text-xs font-medium text-soft-cloud/70 mb-1.5">
                Year
              </label>
              <select
                id="audit-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-midnight-ink px-3 py-2 text-sm text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber disabled:opacity-50"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyber-amber/80 animate-pulse"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-sm text-soft-cloud/70 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                Compiling ELD records and state-mileage logs…
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10 bg-midnight-ink/40">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-soft-cloud/80 hover:text-soft-cloud hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinueToVerification}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileArchive className="size-5" aria-hidden />
            Continue to Verification
          </button>
        </div>
      </div>

      <DataVerificationModal
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        onConfirm={handleVerificationConfirm}
        loading={loading}
      />
    </div>
  );
}
