'use client';

import { getDaysUntil } from '@/lib/compliance';

const DAYS_WARNING = 30;

type Status = 'ok' | 'warning' | 'expired';

function getStatus(expiryDate: string | null): Status | null {
  if (!expiryDate) return null;
  const days = getDaysUntil(expiryDate);
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days <= DAYS_WARNING) return 'warning';
  return 'ok';
}

export function ComplianceStatusBadge({ medCardExpiry }: { medCardExpiry: string | null }) {
  const status = getStatus(medCardExpiry);

  if (status === null) {
    return (
      <span className="inline-flex items-center rounded-md bg-card px-2 py-0.5 text-xs font-medium text-cloud-dancer/60">
        No date
      </span>
    );
  }

  if (status === 'expired') {
    return (
      <span className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/30">
        EXPIRED
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span className="inline-flex items-center rounded-md bg-cyber-amber/20 px-2 py-0.5 text-xs font-semibold text-cyber-amber ring-1 ring-inset ring-cyber-amber/30">
        WARNING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-transformative-teal/20 px-2 py-0.5 text-xs font-medium text-transformative-teal ring-1 ring-inset ring-transformative-teal/30">
      OK
    </span>
  );
}
