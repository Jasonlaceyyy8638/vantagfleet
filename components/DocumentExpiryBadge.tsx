'use client';

import { getExpiryStatus, getDaysUntil } from '@/lib/compliance';

type DocumentExpiryBadgeProps = { expiryDate: string | null };

export function DocumentExpiryBadge({ expiryDate }: DocumentExpiryBadgeProps) {
  const status = getExpiryStatus(expiryDate);
  const days = getDaysUntil(expiryDate);

  if (status === null) {
    return (
      <span className="inline-flex items-center rounded-md bg-card px-2 py-0.5 text-xs font-medium text-soft-cloud/60">
        No date
      </span>
    );
  }

  if (status === 'expired') {
    return (
      <span className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/30">
        Expired
      </span>
    );
  }

  if (status === 'warning') {
    const label = days !== null && days <= 7 ? '< 7 days' : '< 30 days';
    return (
      <span className="inline-flex items-center rounded-md bg-cyber-amber/20 px-2 py-0.5 text-xs font-semibold text-cyber-amber ring-1 ring-inset ring-cyber-amber/30">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-electric-teal/20 px-2 py-0.5 text-xs font-medium text-electric-teal ring-1 ring-inset ring-electric-teal/30">
      Safe
    </span>
  );
}
