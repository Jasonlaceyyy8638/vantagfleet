'use client';

import { MapPin } from 'lucide-react';
import { mockMapRoutes } from '@/src/constants/demoData';

type DemoMapMockProps = {
  className?: string;
  /** Tighter padding / label for hero strip */
  compact?: boolean;
  /** Broker demo: shipment language instead of fleet drivers. */
  variant?: 'fleet' | 'shipments';
};

/**
 * Non-interactive map preview: dashed routes + trucks moving along paths (SVG animateMotion).
 * No Mapbox token — purely decorative for marketing & demo mode.
 */
export function DemoMapMock({ className = '', compact = false, variant = 'fleet' }: DemoMapMockProps) {
  const badgeLabel = variant === 'shipments' ? 'Active shipments' : 'Live map preview';
  const ariaLabel =
    variant === 'shipments'
      ? 'Decorative map with freight routes and moving shipment markers'
      : 'Decorative map with three freight routes and moving truck markers';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-cyber-amber/25 bg-[#050a14] ${className}`}
    >
      <div
        className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-soft-cloud/85 ${
          compact ? 'scale-90 origin-top-left' : ''
        }`}
      >
        <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden />
        {badgeLabel}
      </div>
      <svg
        viewBox="0 0 400 300"
        className="block w-full h-auto aspect-[4/3]"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="demoMapBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1220" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <pattern id="demoMapGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#demoMapBg)" />
        <rect width="400" height="300" fill="url(#demoMapGrid)" opacity={0.85} />

        {mockMapRoutes.map((r) => (
          <path
            key={r.id}
            d={r.pathD}
            fill="none"
            stroke={r.stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 5"
            opacity={0.85}
          />
        ))}

        {mockMapRoutes.map((r) => (
          <g key={`truck-${r.id}`}>
            <circle r={5.5} fill="#0c1222" stroke={r.stroke} strokeWidth={1.5}>
              <animateMotion dur={`${r.durationSec}s`} repeatCount="indefinite" path={r.pathD} />
            </circle>
            <circle r={3} fill="#FFBF00">
              <animateMotion dur={`${r.durationSec}s`} repeatCount="indefinite" path={r.pathD} />
            </circle>
          </g>
        ))}
      </svg>
      <MapPin
        className={`absolute text-cyber-amber/75 pointer-events-none ${
          compact ? 'bottom-2 right-2 size-5' : 'bottom-3 right-3 size-6'
        }`}
        aria-hidden
      />
    </div>
  );
}
