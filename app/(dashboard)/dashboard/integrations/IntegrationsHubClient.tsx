'use client';

import { useState } from 'react';
import {
  saveIntegration,
  connectFmcsaWithPlatformKey,
  runComplianceSync,
  getIntegrationsForOrg,
  type IntegrationRow,
  type IntegrationProvider,
} from '@/app/actions/integrations';
import { syncMotiveFleet } from '@/app/actions/motive-sync';
import { Plug, Loader2, Check, X, RefreshCw, CloudDownload } from 'lucide-react';

const PROVIDERS: { id: IntegrationProvider; name: string; label: string; placeholder: string }[] = [
  { id: 'motive', name: 'Motive', label: 'Motive', placeholder: '' },
  { id: 'fmcsa', name: 'FMCSA', label: 'FMCSA', placeholder: 'Paste key from FMCSA portal' },
];

const COMING_SOON_PROVIDERS: { id: string; name: string; description: string }[] = [
  { id: 'geotab', name: 'Geotab', description: 'Connect Geotab for telematics and fleet data.' },
  { id: 'samsara', name: 'Samsara', description: 'Connect Samsara to sync vehicles and driver data.' },
];

type Props = { orgId: string; initialIntegrations: IntegrationRow[] };

export function IntegrationsHubClient({ orgId, initialIntegrations }: Props) {
  const [integrations, setIntegrations] = useState<IntegrationRow[]>(initialIntegrations);
  const [modalProvider, setModalProvider] = useState<IntegrationProvider | null>(null);
  const [credential, setCredential] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [motiveSyncLoading, setMotiveSyncLoading] = useState(false);
  const [motiveSyncResult, setMotiveSyncResult] = useState<string | null>(null);
  const [motiveLastSyncedAt, setMotiveLastSyncedAt] = useState<string | null>(
    () => initialIntegrations.find((i) => i.provider === 'motive')?.last_synced_at ?? null
  );
  const [syncDataLoading, setSyncDataLoading] = useState(false);
  const [notifyMeProvider, setNotifyMeProvider] = useState<{ id: string; name: string } | null>(null);
  const [notifyMeEmail, setNotifyMeEmail] = useState('');
  const [notifyMeSending, setNotifyMeSending] = useState(false);
  const [notifyMeError, setNotifyMeError] = useState<string | null>(null);
  const [fmcsaConnectLoading, setFmcsaConnectLoading] = useState(false);
  const [fmcsaConnectError, setFmcsaConnectError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProvider) return;
    setError(null);
    setSaving(true);
    const result = await saveIntegration(orgId, modalProvider, credential);
    setSaving(false);
    if ('ok' in result) {
      setModalProvider(null);
      setCredential('');
      const next = await getIntegrationsForOrg(orgId);
      setIntegrations(next);
    } else {
      setError(result.error);
    }
  };

  const handleSync = async () => {
    setSyncResult(null);
    setSyncLoading(true);
    const result = await runComplianceSync(orgId);
    setSyncLoading(false);
    if ('ok' in result) {
      setSyncResult(`Sync complete. ${result.alertsCreated} alert(s) created.`);
    } else {
      setSyncResult(result.error);
    }
  };

  const handleMotiveSync = async () => {
    setMotiveSyncResult(null);
    setMotiveSyncLoading(true);
    const result = await syncMotiveFleet(orgId);
    setMotiveSyncLoading(false);
    if ('ok' in result) {
      setMotiveSyncResult(`Motive sync complete: ${result.vehicles} vehicle(s), ${result.drivers} driver(s).`);
    } else {
      setMotiveSyncResult(result.error);
    }
  };

  const handleSyncData = async () => {
    setMotiveSyncResult(null);
    setSyncDataLoading(true);
    try {
      const res = await fetch('/api/motive/sync', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setMotiveLastSyncedAt(data.last_synced_at ?? new Date().toISOString());
        setMotiveSyncResult(`Synced ${data.vehicles ?? 0} vehicle(s), ${data.drivers ?? 0} driver(s).`);
        const next = await getIntegrationsForOrg(orgId);
        setIntegrations(next);
      } else {
        setMotiveSyncResult(data.error ?? 'Sync failed');
      }
    } catch {
      setMotiveSyncResult('Sync request failed');
    } finally {
      setSyncDataLoading(false);
    }
  };

  function formatLastSynced(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const sec = (Date.now() - d.getTime()) / 1000;
    if (sec < 60) return 'Just Now';
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
    return d.toLocaleDateString();
  }

  const openModal = (provider: IntegrationProvider) => {
    setModalProvider(provider);
    setCredential('');
    setError(null);
    setFmcsaConnectError(null);
  };

  const handleConnectFmcsa = async () => {
    setFmcsaConnectError(null);
    setFmcsaConnectLoading(true);
    const result = await connectFmcsaWithPlatformKey(orgId);
    setFmcsaConnectLoading(false);
    if ('ok' in result) {
      const next = await getIntegrationsForOrg(orgId);
      setIntegrations(next);
    } else {
      setFmcsaConnectError(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => {
          const row = integrations.find((i) => i.provider === p.id);
          const connected = row?.connected ?? false;
          return (
            <div
              key={p.id}
              className="rounded-xl border border-white/10 bg-card p-6 flex flex-col shadow-lg hover:border-cyber-amber/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyber-amber/20">
                  <Plug className="size-6 text-cyber-amber" />
                </div>
                <h2 className="text-lg font-semibold text-soft-cloud">{p.name}</h2>
              </div>
              <p className="text-sm text-soft-cloud/60 mb-4 flex-1">
                {p.id === 'motive' && 'Connect with your Motive account. Click Connect to sign in and authorize—no API key needed.'}
                {p.id === 'fmcsa' && 'Connect FMCSA for safety and compliance data with one click. No API key needed—VantagFleet uses secure FMCSA access for your organization.'}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {connected ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-electric-teal">
                      <Check className="size-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-sm text-soft-cloud/50">Not connected</span>
                  )}
                  <div className="flex items-center gap-2">
                    {p.id === 'motive' && connected && (
                      <button
                        type="button"
                        onClick={handleSyncData}
                        disabled={syncDataLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-amber/20 text-cyber-amber hover:bg-cyber-amber/30 disabled:opacity-60 transition-colors"
                      >
                        {syncDataLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : null}
                        {syncDataLoading ? 'Syncing…' : 'Sync Data'}
                      </button>
                    )}
                    {p.id === 'motive' ? (
                      <a
                        href={`/api/auth/motive?org_id=${encodeURIComponent(orgId)}`}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-amber text-midnight-ink hover:bg-cyber-amber/90 transition-colors inline-block"
                      >
                        {connected ? 'Reconnect' : 'Connect'}
                      </a>
                    ) : p.id === 'fmcsa' ? (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={handleConnectFmcsa}
                          disabled={fmcsaConnectLoading}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-amber text-midnight-ink hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
                        >
                          {fmcsaConnectLoading ? <Loader2 className="size-3.5 animate-spin inline" /> : null}
                          {fmcsaConnectLoading ? 'Connecting…' : connected ? 'Reconnect' : 'Connect'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal('fmcsa')}
                          className="text-xs text-soft-cloud/60 hover:text-cyber-amber transition-colors"
                        >
                          {connected ? 'Use my own key' : 'Use my own API key'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openModal(p.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-amber text-midnight-ink hover:bg-cyber-amber/90 transition-colors"
                      >
                        {connected ? 'Update' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
                {p.id === 'motive' && (motiveLastSyncedAt ?? row?.last_synced_at) && (
                  <p className="text-xs text-soft-cloud/50">
                    Last Synced: {formatLastSynced(motiveLastSyncedAt ?? row?.last_synced_at ?? null)}
                  </p>
                )}
                {p.id === 'fmcsa' && fmcsaConnectError && (
                  <p className="text-xs text-amber-400 mt-1">{fmcsaConnectError}</p>
                )}
              </div>
            </div>
          );
        })}
        {COMING_SOON_PROVIDERS.map((p) => (
          <div
            key={`coming-soon-${p.id}`}
            className="card-shine-wrap relative rounded-xl border border-white/10 bg-card p-6 flex flex-col shadow-lg hover:border-cyber-amber/20 transition-colors"
          >
            <span className="card-shine" aria-hidden />
            <span className="absolute top-3 right-3 rounded-md bg-cyber-amber/20 border border-cyber-amber/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyber-amber">
              Coming Soon
            </span>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-cyber-amber/20" style={{ filter: 'grayscale(1)' }}>
                <Plug className="size-6 text-cyber-amber" />
              </div>
              <h2 className="text-lg font-semibold text-soft-cloud" style={{ filter: 'blur(1px)' }}>
                {p.name}
              </h2>
            </div>
            <p className="text-sm text-soft-cloud/60 mb-4 flex-1" style={{ filter: 'blur(1px)' }}>
              {p.description}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => { setNotifyMeProvider({ id: p.id, name: p.name }); setNotifyMeError(null); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-amber/20 text-cyber-amber hover:bg-cyber-amber/30 transition-colors"
                >
                  Notify Me
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motive fleet sync */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <CloudDownload className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Motive fleet sync</h2>
        </div>
        <p className="text-sm text-soft-cloud/60 mb-4">
          Fetch vehicles and users from Motive and upsert them into your fleet. Connect Motive first, then run sync.
        </p>
        <button
          type="button"
          onClick={handleMotiveSync}
          disabled={motiveSyncLoading || !integrations.some((i) => i.provider === 'motive' && i.connected)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium hover:bg-cyber-amber/30 disabled:opacity-60 transition-colors"
        >
          {motiveSyncLoading ? <Loader2 className="size-4 animate-spin" /> : <CloudDownload className="size-4" />}
          {motiveSyncLoading ? 'Syncing…' : 'Sync from Motive'}
        </button>
        {motiveSyncResult && (
          <p className={`mt-3 text-sm ${motiveSyncResult.startsWith('Motive sync') ? 'text-electric-teal' : 'text-amber-400'}`}>
            {motiveSyncResult}
          </p>
        )}
      </section>

      {/* Compliance sync */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Compliance checker</h2>
        </div>
        <p className="text-sm text-soft-cloud/60 mb-4">
          Run a sync to check drivers and vehicles. Alerts are created for expired medical cards (CDL compliance) and missing or past-due annual inspections.
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium hover:bg-cyber-amber/30 disabled:opacity-60 transition-colors"
        >
          {syncLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {syncLoading ? 'Syncing…' : 'Sync now'}
        </button>
        {syncResult && (
          <p className={`mt-3 text-sm ${syncResult.startsWith('Sync complete') ? 'text-electric-teal' : 'text-amber-400'}`}>
            {syncResult}
          </p>
        )}
      </section>

      {modalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => { setModalProvider(null); setError(null); }}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl border-cyber-amber/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-soft-cloud">
                Connect {PROVIDERS.find((p) => p.id === modalProvider)?.name}
              </h3>
              <button
                type="button"
                onClick={() => { setModalProvider(null); setError(null); }}
                className="p-2 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-soft-cloud/70 mb-4">
              {modalProvider === 'fmcsa'
                ? 'Optional: paste your own FMCSA API key from the FMCSA portal to use instead of the platform connection.'
                : 'Enter your API key or credentials from your provider.'}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="integration-credential" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  API Key
                </label>
                <input
                  id="integration-credential"
                  type="password"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder={modalProvider === 'fmcsa' ? 'Paste key from FMCSA portal' : 'Paste your API key'}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalProvider(null); setError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !credential.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notify Me modal for coming-soon integrations */}
      {notifyMeProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => { setNotifyMeProvider(null); setNotifyMeEmail(''); setNotifyMeError(null); }}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl border-cyber-amber/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-soft-cloud">Notify Me</h3>
              <button
                type="button"
                onClick={() => { setNotifyMeProvider(null); setNotifyMeEmail(''); setNotifyMeError(null); }}
                className="p-2 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-soft-cloud/80 mb-4">
              We are currently finalizing our {notifyMeProvider.name} integration. Enter your email to be the first to know when it drops.
            </p>
            {notifyMeError && <p className="text-sm text-red-400 mb-2">{notifyMeError}</p>}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!notifyMeProvider) return;
                setNotifyMeSending(true);
                try {
                  const res = await fetch('/api/notify-me', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      provider: notifyMeProvider.id,
                      email: notifyMeEmail.trim(),
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.ok) {
                    setNotifyMeProvider(null);
                    setNotifyMeEmail('');
                    setNotifyMeError(null);
                  } else {
                    setNotifyMeError(data.error ?? 'Could not submit. Try again.');
                  }
                } catch {
                  setNotifyMeError('Request failed. Try again.');
                } finally {
                  setNotifyMeSending(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="notify-email" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Email
                </label>
                <input
                  id="notify-email"
                  type="email"
                  value={notifyMeEmail}
                  onChange={(e) => setNotifyMeEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setNotifyMeProvider(null); setNotifyMeEmail(''); setNotifyMeError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notifyMeSending || !notifyMeEmail.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
                >
                  {notifyMeSending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {notifyMeSending ? 'Sending…' : 'Notify Me'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
