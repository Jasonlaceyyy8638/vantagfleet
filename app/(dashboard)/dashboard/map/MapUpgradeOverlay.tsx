'use client';

import { useState } from 'react';
import { MapPreview } from '@/components/MapPreview';
import { LiveMapUpgradeModal } from '@/components/LiveMapUpgradeModal';

/**
 * Full-page upgrade experience for Solo Pro users on /dashboard/map:
 * blurred map background + centered upgrade modal (shown on load).
 */
export function MapUpgradeOverlay() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="relative">
      <MapPreview className="min-h-[calc(100vh-6rem)] rounded-xl" />
      <LiveMapUpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        showTrialCopy={true}
      />
    </div>
  );
}
