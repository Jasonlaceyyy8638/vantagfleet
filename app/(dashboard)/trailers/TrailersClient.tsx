'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, Loader2 } from 'lucide-react';

type Trailer = {
  id: string;
  trailer_number: string;
  vin: string | null;
  plate_number: string | null;
  assigned_driver_id: string | null;
  created_at?: string;
};

type Driver = { id: string; name: string };

type Props = {
  orgId: string;
  initialTrailers: Trailer[];
  drivers: Driver[];
};

export function TrailersClient({ orgId, initialTrailers, drivers }: Props) {
  const [trailers, setTrailers] = useState<Trailer[]>(initialTrailers);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newVin, setNewVin] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [addError, setAddError] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchTrailers = async () => {
    const res = await fetch('/api/trailers');
    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data.trailers)) setTrailers(data.trailers);
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = newNumber.trim();
    if (!num) return;
    setLoading(true);
    setAddError('');
    const res = await fetch('/api/trailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trailer_number: num,
        vin: newVin.trim() || null,
        plate_number: newPlate.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setAddError(data.error ?? 'Failed to add trailer');
      return;
    }
    setAddOpen(false);
    setNewNumber('');
    setNewVin('');
    setNewPlate('');
    fetchTrailers();
  };

  const handleAssign = async (trailerId: string, driverId: string | null) => {
    setAssigningId(trailerId);
    const res = await fetch(`/api/trailers/${trailerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_driver_id: driverId || null }),
    });
    setAssigningId(null);
    if (res.ok) fetchTrailers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-soft-cloud">Trailers</h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
        >
          <Plus className="size-5" />
          Add trailer
        </button>
      </div>
      <p className="text-sm text-soft-cloud/70">
        Assign trailers to drivers. Assigned trailers show on the Roadside page when you select that driver.
      </p>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-4 py-3">Trailer #</th>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">VIN</th>
                <th className="px-4 py-3">Assigned driver</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trailers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-soft-cloud/60 text-center">
                    No trailers yet. Click &quot;Add trailer&quot; to add one.
                  </td>
                </tr>
              ) : (
                trailers.map((t) => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-soft-cloud font-medium">{t.trailer_number}</td>
                    <td className="px-4 py-3 text-soft-cloud/80">{t.plate_number ?? '—'}</td>
                    <td className="px-4 py-3 text-soft-cloud/80">{t.vin ?? '—'}</td>
                    <td className="px-4 py-3 text-soft-cloud/80">
                      {t.assigned_driver_id
                        ? drivers.find((d) => d.id === t.assigned_driver_id)?.name ?? '—'
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.assigned_driver_id ?? ''}
                        onChange={(e) => handleAssign(t.id, e.target.value || null)}
                        disabled={assigningId === t.id}
                        className="bg-deep-ink border border-white/10 rounded px-2 py-1 text-soft-cloud text-sm min-w-[140px]"
                      >
                        <option value="">— Unassigned —</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {assigningId === t.id && (
                        <Loader2 className="inline-block size-4 animate-spin ml-1 text-cyber-amber" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-labelledby="add-trailer-title"
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl">
            <h2 id="add-trailer-title" className="text-lg font-semibold text-soft-cloud mb-4">
              Add trailer
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Trailer number *</label>
                <input
                  type="text"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="e.g. TRL-001"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Plate number (optional)</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="e.g. ABC-1234"
                  className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">VIN (optional)</label>
                <input
                  type="text"
                  value={newVin}
                  onChange={(e) => setNewVin(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                />
              </div>
              {addError && <p className="text-sm text-red-400">{addError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50"
                >
                  {loading ? 'Adding…' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddOpen(false); setAddError(''); }}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="text-sm text-soft-cloud/60">
        <a href="/roadside-mode" className="text-cyber-amber hover:underline">← Roadside</a>
        {' · '}
        <a href="/dashboard" className="text-cyber-amber hover:underline">Dashboard</a>
      </p>
    </div>
  );
}
