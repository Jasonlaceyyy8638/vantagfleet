'use client';

import Link from 'next/link';
import { MapPin, Lock } from 'lucide-react';

type LiveMapLockPreviewProps = {
  /** When provided, CTA and locked area use this instead of linking to /pricing (e.g. open upgrade modal). */
  onUpgradeClick?: () => void;
};

/** Shown when user cannot see the Live Map (e.g. Solo Pro). Blurred map preview + upgrade CTA. */
export function LiveMapLockPreview({ onUpgradeClick }: LiveMapLockPreviewProps) {
  const cta = onUpgradeClick ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onUpgradeClick();
      }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors shadow-lg shadow-cyber-amber/20"
    >
      <MapPin className="size-5" />
      Unlock Live Fleet Tracking
    </button>
  ) : (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors shadow-lg shadow-cyber-amber/20"
    >
      <MapPin className="size-5" />
      Unlock Live Fleet Tracking
    </Link>
  );

  return (
    <div className="relative rounded-xl border border-white/10 bg-midnight-ink overflow-hidden" style={{ height: '520px' }}>
      {/* Map-style background (gradient + grid hint) */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-midnight-ink"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-midnight-ink/70 backdrop-blur-md" aria-hidden />
      {/* CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-4">
          <div className="rounded-full bg-cyber-amber/20 p-4">
            <Lock className="size-10 text-cyber-amber" aria-hidden />
          </div>
          <h3 className="text-xl font-semibold text-soft-cloud">Live Fleet Tracking</h3>
          <p className="text-soft-cloud/80 text-sm max-w-sm">
            See your trucks in real time on the map. Available on Fleet Master and Enterprise plans.
          </p>
          {cta}
        </div>
      </div>
    </div>
  );
}
