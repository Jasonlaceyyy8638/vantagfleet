'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTimeAgo } from '@/lib/time-ago';

export type SystemStatus = 'live' | 'syncing' | 'error' | 'no_eld';

type Props = {
  status?: SystemStatus;
  /** Provider name for tooltip, e.g. "Motive" or "Geotab" */
  providerName?: string;
  /** ISO timestamp of last successful fleet sync (from carrier_integrations.last_synced_at) */
  lastSyncedAt?: string | null;
  /**
   * `eld` — fleet / ELD sync (carriers).
   * `network` — broker workspace; no org-owned ELD connection.
   */
  variant?: 'eld' | 'network';
};

const CONFIG: Record<
  SystemStatus,
  { label: string; dotClass: string; statusLabel: string }
> = {
  live: {
    label: 'Systems Live',
    dotClass: 'bg-emerald-500 text-emerald-500',
    statusLabel: 'Healthy',
  },
  syncing: {
    label: 'Syncing Fleet...',
    dotClass: 'bg-blue-500 text-blue-500',
    statusLabel: 'Syncing',
  },
  error: {
    label: 'Connection Alert',
    dotClass: 'bg-amber-500 text-amber-500',
    statusLabel: 'Alert',
  },
  no_eld: {
    label: 'Telematics',
    dotClass: 'bg-slate-500 text-slate-500',
    statusLabel: 'Not linked',
  },
};

export function SystemStatusIndicator({
  status = 'live',
  providerName,
  lastSyncedAt,
  variant = 'eld',
}: Props) {
  const { label, dotClass, statusLabel } = CONFIG[status];
  const [timeAgo, setTimeAgo] = useState(() => getTimeAgo(lastSyncedAt ?? null));
  const [hover, setHover] = useState(false);

  const refreshTimeAgo = useCallback(() => {
    setTimeAgo(getTimeAgo(lastSyncedAt ?? null));
  }, [lastSyncedAt]);

  useEffect(() => {
    if (variant === 'network') return;
    refreshTimeAgo();
    const interval = setInterval(refreshTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [refreshTimeAgo, variant]);

  const syncText = lastSyncedAt ? timeAgo : 'Pending First Sync';

  if (variant === 'network') {
    const networkLabel = 'Network status';
    return (
      <span
        className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-soft-cloud/80 text-xs font-medium"
        role="status"
        aria-live="polite"
        aria-label={`${networkLabel}: vetted carrier partners — brokers do not connect an asset ELD in this workspace.`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span
          className="size-2 rounded-full status-dot-pulse bg-emerald-500 text-emerald-500"
          style={{ boxShadow: 'none' }}
          aria-hidden
        />
        <span className="hidden sm:inline whitespace-nowrap">{networkLabel}</span>
        {hover && (
          <span
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg border border-white/10 bg-midnight-ink shadow-xl text-left text-xs font-normal max-w-[min(20rem,calc(100vw-2rem))] z-[200] pointer-events-none"
            role="tooltip"
          >
            <span className="text-soft-cloud">
              Vetted carrier network and lanes — brokers do not connect their own ELD. Manage partners under Network.
            </span>
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-soft-cloud/80 text-xs font-medium"
      role="status"
      aria-live="polite"
      aria-label={`ELD / connection status: ${label}. Last fleet sync: ${syncText}.`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className={`size-2 rounded-full ${status === 'live' || status === 'syncing' ? 'status-dot-pulse ' : ''}${dotClass}`}
        style={{ boxShadow: 'none' }}
        aria-hidden
      />
      <span className="hidden sm:inline whitespace-nowrap">{label}</span>

      {/* Custom tooltip: Status: Healthy | Last Fleet Sync: [time ago] */}
      {hover && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg border border-white/10 bg-midnight-ink shadow-xl text-left text-xs font-normal whitespace-nowrap z-[200] pointer-events-none"
          role="tooltip"
        >
          <span className="text-soft-cloud">
            Status: {statusLabel}
            {providerName ? ` (${providerName})` : ''}
          </span>
          <span className="text-soft-cloud/60 mx-1.5">|</span>
          <span className="text-sky-300/90">Last Fleet Sync: {syncText}</span>
        </span>
      )}
    </span>
  );
}
