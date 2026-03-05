'use client';

import { useState, useEffect } from 'react';
import { X, FileArchive, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CHECKLIST_ITEMS = [
  {
    id: 'fuel' as const,
    label: 'Fuel Accuracy',
    description: 'I have uploaded and verified all fuel receipts for this period.',
  },
  {
    id: 'eld' as const,
    label: 'ELD Sync',
    description: 'I have confirmed that my Motive/Geotab data is fully synced for all active trucks.',
  },
  {
    id: 'manual' as const,
    label: 'Manual Miles',
    description: 'I have manually entered any mileage for vehicles not equipped with an ELD.',
  },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when user has checked all boxes and clicks Download Audit-Ready ZIP */
  onConfirm: () => void;
  /** When true, show loading state on the download button (e.g. while ZIP is generating) */
  loading?: boolean;
};

export function DataVerificationModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  const [fuel, setFuel] = useState(false);
  const [eld, setEld] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!open) {
      setFuel(false);
      setEld(false);
      setManual(false);
    }
  }, [open]);

  const allChecked = fuel && eld && manual;
  const canDownload = allChecked && !loading;

  const handleConfirm = () => {
    if (!canDownload) return;
    onConfirm();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-verification-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="data-verification-title" className="text-lg font-semibold text-soft-cloud flex items-center gap-2">
            <CheckCircle2 className="size-5 text-electric-teal" aria-hidden />
            Data Verification
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

        <div className="p-5 space-y-4">
          <p className="text-sm text-soft-cloud/80">
            Please confirm the following before generating your audit-ready export. All items are required.
          </p>

          <ul className="space-y-4" role="list">
            {CHECKLIST_ITEMS.map((item) => {
              const checked =
                item.id === 'fuel' ? fuel : item.id === 'eld' ? eld : manual;
              const setChecked =
                item.id === 'fuel' ? setFuel : item.id === 'eld' ? setEld : setManual;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`verify-${item.id}`}
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    disabled={loading}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-midnight-ink text-cyber-amber focus:ring-2 focus:ring-cyber-amber/50 focus:ring-offset-0 focus:ring-offset-midnight-ink disabled:opacity-50"
                    aria-describedby={`verify-${item.id}-desc`}
                  />
                  <label
                    htmlFor={`verify-${item.id}`}
                    className="flex-1 cursor-pointer select-none"
                    id={`verify-${item.id}-desc`}
                  >
                    <span className="block text-sm font-medium text-soft-cloud">
                      {item.label}
                    </span>
                    <span className="block text-xs text-soft-cloud/70 mt-0.5">
                      {item.description}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="rounded-lg border border-white/10 bg-midnight-ink/50 px-4 py-3 mt-4">
            <p className="text-xs text-soft-cloud/60 leading-relaxed">
              By proceeding, you acknowledge that VantagFleet is a data processing tool and you are responsible for the final accuracy of your IFTA filings per our{' '}
              <Link href="/terms" className="text-cyber-amber hover:underline focus:outline-none focus:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
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
            onClick={handleConfirm}
            disabled={!canDownload}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <FileArchive className="size-5" aria-hidden />
                Download Audit-Ready ZIP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
