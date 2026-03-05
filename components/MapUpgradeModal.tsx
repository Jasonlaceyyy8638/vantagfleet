'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type MapUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function MapUpgradeModal({ open, onClose }: MapUpgradeModalProps) {
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
          tier: 'fleet_master',
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
      aria-labelledby="map-upgrade-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close"
      />
      {/* Map-style background (blurred) */}
      <div
        className="absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-midnight-ink" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute inset-0 backdrop-blur-md" />
      </div>
      {/* Glassmorphism card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 id="map-upgrade-title" className="text-xl sm:text-2xl font-bold text-soft-cloud leading-tight">
              Unlock Real-Time Fleet Intelligence
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-soft-cloud/70 hover:text-soft-cloud hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <ul className="space-y-3 mb-8 text-soft-cloud/90 text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-lg" aria-hidden>🛰️</span>
              <span><strong className="text-soft-cloud">Live GPS Tracking:</strong> See every truck on one map.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-lg" aria-hidden>🚦</span>
              <span><strong className="text-soft-cloud">Universal ELD Integration (Motive, Geotab, Samsara):</strong> Real-time HOS and location sync.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-lg" aria-hidden>📈</span>
              <span><strong className="text-soft-cloud">Live Profit-Per-Mile:</strong> See which loads are making money right now.</span>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="flex-1 px-6 py-3.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-cyber-amber/20"
            >
              {loading ? 'Redirecting…' : 'Upgrade to Fleet Master'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-white/20 text-soft-cloud/80 hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
