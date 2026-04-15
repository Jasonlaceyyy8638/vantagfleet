'use client';

import { useEffect, useState } from 'react';
import { X, Satellite, Route, DollarSign } from 'lucide-react';

type LiveMapUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  /** When true, show "Start 7-Day Free Trial"; otherwise "Upgrade Now". */
  showTrialCopy?: boolean;
};

export function LiveMapUpgradeModal({ open, onClose, showTrialCopy = true }: LiveMapUpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'vantag',
          billing: 'monthly',
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error ?? 'Checkout failed');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-map-upgrade-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
      />
      {/* Sleek white-label modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200/80 bg-white shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2
              id="live-map-upgrade-title"
              className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight"
            >
              Upgrade to Fleet Master for Live Tracking
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
            Connect your ELD (Motive, Geotab, or Samsara) and see your entire fleet&apos;s live location, HOS status, and real-time profit margins.
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 rounded-lg bg-amber-100 p-2">
                <Satellite className="size-5 text-amber-600" aria-hidden />
              </span>
              <div>
                <span className="font-semibold text-gray-900">Live GPS:</span>
                <span className="text-gray-600"> Real-time truck movement.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 rounded-lg bg-emerald-100 p-2">
                <Route className="size-5 text-emerald-600" aria-hidden />
              </span>
              <div>
                <span className="font-semibold text-gray-900">Auto-IFTA:</span>
                <span className="text-gray-600"> Automatic state-line mileage tracking.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 rounded-lg bg-blue-100 p-2">
                <DollarSign className="size-5 text-blue-600" aria-hidden />
              </span>
              <div>
                <span className="font-semibold text-gray-900">Live Profit:</span>
                <span className="text-gray-600"> Instant revenue vs. fuel cost per truck.</span>
              </div>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="flex-1 px-6 py-3.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-cyber-amber/20"
            >
              {loading
                ? 'Redirecting…'
                : showTrialCopy
                  ? 'Start 7-Day Free Trial'
                  : 'Upgrade Now'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
