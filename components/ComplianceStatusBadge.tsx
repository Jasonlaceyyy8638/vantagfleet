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
      <span className="inline-flex items-center rounded-md bg-slate-600/50 px-2 py-0.5 text-xs font-medium text-slate-400">
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
      <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
        WARNING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
      OK
    </span>
  );
}
