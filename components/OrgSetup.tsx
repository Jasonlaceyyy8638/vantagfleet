'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupOrganization } from '@/app/actions/auth';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

export function OrgSetup() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await setupOrganization(companyName, dotNumber, fleetSize);
      if ('ok' in result && result.ok) {
        router.refresh();
        return;
      }
      if ('error' in result) {
        setError(result.error);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size={64} className="shrink-0" />
          <h1 className="text-xl font-bold text-cyber-amber mt-4">Set up your organization</h1>
          <p className="text-soft-cloud/70 text-sm mt-2">
            Add your company details to get started with VantagFleet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="org-setup-company" className="block text-sm font-medium text-soft-cloud mb-1">
              Company name *
            </label>
            <input
              id="org-setup-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Acme Trucking"
              className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder:text-soft-cloud/40 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            />
          </div>
          <div>
            <label htmlFor="org-setup-dot" className="block text-sm font-medium text-soft-cloud mb-1">
              DOT number *
            </label>
            <input
              id="org-setup-dot"
              type="text"
              value={dotNumber}
              onChange={(e) => setDotNumber(e.target.value)}
              required
              placeholder="e.g. 123456"
              className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder:text-soft-cloud/40 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            />
          </div>
          <div>
            <label htmlFor="org-setup-fleet" className="block text-sm font-medium text-soft-cloud mb-1">
              Fleet size
            </label>
            <input
              id="org-setup-fleet"
              type="text"
              inputMode="numeric"
              value={fleetSize}
              onChange={(e) => setFleetSize(e.target.value)}
              placeholder="Number of vehicles (optional)"
              className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder:text-soft-cloud/40 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Creating…
              </>
            ) : (
              'Create organization'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
