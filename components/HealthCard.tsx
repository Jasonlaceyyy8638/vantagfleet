'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export type HealthStatus = {
  motive: 'online' | 'error';
  motus: 'pending' | 'online';
  lastSync: string;
  motiveError?: 'expired' | 'disconnected';
};

async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch('/api/health', { cache: 'no-store' });
  if (!res.ok) throw new Error('Health check failed');
  const data = await res.json();
  return {
    motive: data.motive ?? 'error',
    motus: data.motus ?? 'pending',
    lastSync: data.lastSync ?? '',
    motiveError: data.motiveError ?? undefined,
  };
}

function formatLastSync(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  } catch {
    return '—';
  }
}

function StatusDot({
  status,
  variant,
}: {
  status: 'online' | 'pending' | 'error';
  variant: 'motive' | 'motus';
}) {
  const isActionRequired = variant === 'motive' && status === 'error';

  if (status === 'online') {
    return (
      <span
        className="relative flex h-2.5 w-2.5"
        aria-label="Online"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
    );
  }

  if (isActionRequired) {
    return (
      <span
        className="relative flex h-2.5 w-2.5"
        aria-label="Action required"
      >
        <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-red-500 opacity-90" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
    );
  }

  // Pending: static gray
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full bg-gray-500"
      aria-label="Pending"
    />
  );
}

export function HealthCard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  // Tauri updater: if running in desktop app, check for available update
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown };
    if (!w.__TAURI__ && !w.__TAURI_INTERNAL__) return;

    let cancelled = false;
    (async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const updateResult = await check();
        if (cancelled || !updateResult?.version) return;
        setUpdateVersion(updateResult.version);
      } catch {
        // Not in Tauri or updater not available
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const motiveStatus = health?.motive === 'online' ? 'online' : health?.motiveError === 'expired' ? 'error' : health?.motive === 'error' ? 'error' : 'pending';
  const motusStatus = health?.motus === 'online' ? 'online' : 'pending';

  return (
    <div className="rounded-xl border border-white/10 bg-midnight-ink/90 shadow-lg overflow-hidden min-w-[200px]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-soft-cloud/70">
          Connection Health
        </span>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-soft-cloud/60 hover:text-cyber-amber hover:bg-white/5 disabled:opacity-50 transition-colors"
          aria-label="Refresh connection status"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {updateVersion && (
          <div className="rounded-md bg-cyber-amber/20 border border-cyber-amber/40 px-2.5 py-1 text-center">
            <span className="text-xs font-medium text-cyber-amber">
              Update v{updateVersion} Ready
            </span>
          </div>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {!error && (
          <>
            <div className="flex items-center gap-2.5">
              <StatusDot status={motiveStatus} variant="motive" />
              <span className="text-sm text-soft-cloud/90">Motive</span>
              <span className="text-xs text-soft-cloud/50 ml-auto">
                {health?.motive === 'online'
                  ? 'Online'
                  : health?.motiveError === 'expired'
                    ? 'Action required'
                    : health?.motive === 'error'
                      ? 'Disconnected'
                      : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <StatusDot status={motusStatus} variant="motus" />
              <span className="text-sm text-soft-cloud/90">Motus</span>
              <span className="text-xs text-soft-cloud/50 ml-auto">
                {health?.motus === 'online' ? 'Online' : 'Pending'}
              </span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-soft-cloud/60">
                Last sync: {formatLastSync(health?.lastSync ?? '')}
              </p>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soft-cloud/50 mb-1">
                Roadmap
              </p>
              <p className="text-xs text-soft-cloud/60">
                Coming soon: Samsara
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
