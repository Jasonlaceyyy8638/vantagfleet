'use client';

import { useState } from 'react';
import {
  saveIntegration,
  runComplianceSync,
  getIntegrationsForOrg,
  type IntegrationRow,
  type IntegrationProvider,
} from '@/app/actions/integrations';
import { syncMotiveFleet } from '@/app/actions/motive-sync';
import { Plug, Loader2, Check, X, RefreshCw, CloudDownload } from 'lucide-react';

const PROVIDERS: { id: IntegrationProvider; name: string; label: string; placeholder: string }[] = [
  { id: 'samsara', name: 'Samsara', label: 'Samsara', placeholder: 'API Key or Client ID' },
  { id: 'motive', name: 'Motive', label: 'Motive', placeholder: 'API Key or Client ID' },
  { id: 'fmcsa', name: 'FMCSA', label: 'FMCSA', placeholder: 'API Key or Client ID' },
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

  const openModal = (provider: IntegrationProvider) => {
    setModalProvider(provider);
    setCredential('');
    setError(null);
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
                {p.id === 'samsara' && 'Connect Samsara to sync vehicles and driver data.'}
                {p.id === 'motive' && 'Connect Motive (formerly KeepTruckin) for ELD and fleet data.'}
                {p.id === 'fmcsa' && 'Connect FMCSA for safety and compliance data.'}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {connected ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-electric-teal">
                      <Check className="size-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-sm text-soft-cloud/50">Not connected</span>
                  )}
                  <button
                    type="button"
                    onClick={() => openModal(p.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-amber text-midnight-ink hover:bg-cyber-amber/90 transition-colors"
                  >
                    {connected ? 'Update' : 'Connect'}
                  </button>
                </div>
                {p.id === 'motive' && !connected && (
                  <a
                    href={`/api/auth/motive?org_id=${encodeURIComponent(orgId)}`}
                    className="text-xs text-cyber-amber/90 hover:text-cyber-amber"
                  >
                    Or sign in with Motive OAuth →
                  </a>
                )}
              </div>
            </div>
          );
        })}
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
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="integration-credential" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  API Key or Client ID
                </label>
                <input
                  id="integration-credential"
                  type="password"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder={PROVIDERS.find((p) => p.id === modalProvider)?.placeholder}
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
    </div>
  );
}
