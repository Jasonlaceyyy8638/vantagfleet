'use client';

import { useState } from 'react';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import { LiveMapLockPreview } from '@/components/LiveMapLockPreview';
import { MapUpgradeModal } from '@/components/MapUpgradeModal';

type DashboardMapSectionProps = {
  mapAccess: boolean;
  mapboxToken: string;
};

export function DashboardMapSection({ mapAccess, mapboxToken }: DashboardMapSectionProps) {
  const [mapUpgradeModalOpen, setMapUpgradeModalOpen] = useState(false);

  if (mapAccess) {
    return (
      <FleetMapDynamic
        accessToken={mapboxToken}
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
