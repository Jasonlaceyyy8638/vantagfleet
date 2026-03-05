'use client';

import { useState, useEffect } from 'react';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import { LiveMapLockPreview } from '@/components/LiveMapLockPreview';
import { MapUpgradeModal } from '@/components/MapUpgradeModal';

type DashboardMapSectionProps = {
  mapAccess: boolean;
  mapboxToken: string;
};

export function DashboardMapSection({ mapAccess, mapboxToken }: DashboardMapSectionProps) {
  const [mapUpgradeModalOpen, setMapUpgradeModalOpen] = useState(false);
  const [runtimeToken, setRuntimeToken] = useState<string | null>(null);

  useEffect(() => {
    if (!mapAccess) return;
    fetch('/api/mapbox-token')
      .then((r) => r.json())
      .then((data) => setRuntimeToken(typeof data?.token === 'string' ? data.token.trim() : ''))
      .catch(() => setRuntimeToken(''));
  }, [mapAccess]);

  if (mapAccess) {
    if (runtimeToken === null) {
      return <div className="mt-2 h-[520px] rounded-xl border border-white/10 bg-card flex items-center justify-center text-soft-cloud/60 text-sm">Loading map…</div>;
    }
    return (
      <FleetMapDynamic
        accessToken={runtimeToken}
        height="520px"
        className="mt-2"
      />
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setMapUpgradeModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMapUpgradeModalOpen(true);
          }
        }}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyber-amber focus-visible:ring-offset-2 focus-visible:ring-offset-midnight-ink rounded-xl"
        aria-label="Live map locked — click to see upgrade options"
      >
        <LiveMapLockPreview onUpgradeClick={() => setMapUpgradeModalOpen(true)} />
      </div>
      <MapUpgradeModal open={mapUpgradeModalOpen} onClose={() => setMapUpgradeModalOpen(false)} />
    </>
  );
}
