'use client';

import { useState } from 'react';
import { addNewCustomer } from '@/app/actions/admin';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

type OrgRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  status: string;
  stripe_customer_id: string | null;
  created_at: string;
};

export function OrgSetupClient({ initialOrgs }: { initialOrgs: OrgRow[] }) {
  const [orgs, setOrgs] = useState<OrgRow[]>(initialOrgs);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [usdot, setUsdot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await addNewCustomer(name.trim(), usdot.trim() || null);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setModal(false);
      setName('');
      setUsdot('');
      setOrgs((prev) => [
        {
          id: result.orgId,
          name: name.trim(),
          usdot_number: usdot.trim() || null,
          status: 'active',
          stripe_customer_id: result.stripeCustomerId,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
      >
        <Plus className="size-5" />
        Add organization
      </button>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <h2 className="text-lg font-semibold text-soft-cloud p-4 border-b border-white/10">
          Recent organizations
        </h2>
        {orgs.length === 0 ? (
          <p className="p-6 text-soft-cloud/60 text-sm">No organizations yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {orgs.map((org) => (
              <li key={org.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-soft-cloud">{org.name}</p>
                  {org.usdot_number && (
                    <p className="text-sm text-soft-cloud/60">USDOT {org.usdot_number}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-soft-cloud/50">{org.status}</span>
                  <Link
                    href={`/admin/support?q=${encodeURIComponent(org.name)}`}
                    className="text-sm text-cyber-amber hover:underline"
                  >
                    Manage →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-soft-cloud mb-4">Add organization</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="org-name" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Company name *
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              <div>
                <label htmlFor="org-usdot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  USDOT number (optional)
                </label>
                <input
                  id="org-usdot"
                  type="text"
                  value={usdot}
                  onChange={(e) => setUsdot(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
