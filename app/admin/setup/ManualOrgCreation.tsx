'use client';

import { useState } from 'react';
import { createOrganizationForCustomer } from '@/app/actions/admin';
import { Building2, Loader2 } from 'lucide-react';

export function ManualOrgCreation() {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const fs = fleetSize.trim() ? parseInt(fleetSize.trim(), 10) : null;
      if (fleetSize.trim() && (Number.isNaN(fs!) || fs! < 0)) {
        setError('Fleet size must be a positive number.');
        return;
      }
      const result = await createOrganizationForCustomer(
        companyName.trim(),
        dotNumber.trim(),
        fs,
        customerEmail.trim() || undefined
      );
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setSuccess(`Organization created. ${customerEmail.trim() ? 'Customer linked as Owner.' : 'Share an invite link from Customer Support to add them.'}`);
      setCompanyName('');
      setDotNumber('');
      setFleetSize('');
      setCustomerEmail('');
      setTimeout(() => setOpen(false), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
      >
        <Building2 className="size-5" />
        Manual Org Creation
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-soft-cloud mb-1">Manual Org Creation</h2>
            <p className="text-sm text-soft-cloud/60 mb-4">
              Set up an organization for a customer over the phone. Optionally link them by email as Owner.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="manual-company" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Company name *
                </label>
                <input
                  id="manual-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              <div>
                <label htmlFor="manual-dot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  DOT number *
                </label>
                <input
                  id="manual-dot"
                  type="text"
                  value={dotNumber}
                  onChange={(e) => setDotNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              <div>
                <label htmlFor="manual-fleet" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Fleet size (optional)
                </label>
                <input
                  id="manual-fleet"
                  type="text"
                  inputMode="numeric"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(e.target.value)}
                  placeholder="Number of vehicles"
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder:text-soft-cloud/40 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              <div>
                <label htmlFor="manual-email" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Link to customer (email, optional)
                </label>
                <input
                  id="manual-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder:text-soft-cloud/40 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-400">{success}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
    </>
  );
}
