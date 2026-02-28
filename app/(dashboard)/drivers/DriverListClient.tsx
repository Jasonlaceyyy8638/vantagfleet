'use client';

import { createClient } from '@/lib/supabase/client';
import { ComplianceStatusBadge } from '@/components/ComplianceStatusBadge';
import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';

type Driver = {
  id: string;
  name: string;
  license_number: string | null;
  license_state: string | null;
  med_card_expiry: string | null;
  clearinghouse_status: string | null;
};

export function DriverListClient({
  orgId,
  initialDrivers,
}: {
  orgId: string;
  initialDrivers: Driver[];
}) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [medCardExpiry, setMedCardExpiry] = useState('');
  const [clearinghouseStatus, setClearinghouseStatus] = useState('');

  const supabase = createClient();

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        org_id: orgId,
        name: name.trim(),
        license_number: licenseNumber.trim() || null,
        license_state: licenseState.trim() || null,
        med_card_expiry: medCardExpiry || null,
        clearinghouse_status: clearinghouseStatus.trim() || null,
      })
      .select('id, name, license_number, license_state, med_card_expiry, clearinghouse_status')
      .single();
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setDrivers((prev) => [...prev, data]);
    setName('');
    setLicenseNumber('');
    setLicenseState('');
    setMedCardExpiry('');
    setClearinghouseStatus('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-cloud-dancer/70 text-sm">{drivers.length} driver{drivers.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 text-deep-ink text-sm font-medium"
        >
          <UserPlus className="size-4" />
          Add driver
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddDriver}
          className="rounded-xl border border-[#30363d] bg-card p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-cloud-dancer">New driver</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="Driver full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Med card expiry</label>
              <input
                type="date"
                value={medCardExpiry}
                onChange={(e) => setMedCardExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">License number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">License state</label>
              <input
                type="text"
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="e.g. CA"
                maxLength={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Clearinghouse status</label>
              <input
                type="text"
                value={clearinghouseStatus}
                onChange={(e) => setClearinghouseStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="Optional"
              />
            </div>
          </div>
          {message && <p className="text-sm text-red-400">{message}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-[#30363d] text-cloud-dancer text-sm hover:bg-deep-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink text-sm font-medium"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Add driver
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        {drivers.length === 0 ? (
          <div className="px-5 py-10 text-center text-cloud-dancer/50 text-sm">
            No drivers yet. Add your first driver above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-card">
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">License</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">Med card expiry</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">Compliance status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-deep-ink">
                  <td className="py-3 px-4 text-cloud-dancer font-medium">{d.name}</td>
                  <td className="py-3 px-4 text-cloud-dancer/80 text-sm">
                    {d.license_number && d.license_state
                      ? `${d.license_number} (${d.license_state})`
                      : d.license_number || '—'}
                  </td>
                  <td className="py-3 px-4 text-cloud-dancer/80 text-sm">
                    {d.med_card_expiry || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <ComplianceStatusBadge medCardExpiry={d.med_card_expiry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
