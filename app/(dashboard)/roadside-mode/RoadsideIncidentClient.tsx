'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, FileText } from 'lucide-react';
import Link from 'next/link';

type Incident = {
  id: string;
  vehicle_id: string | null;
  vehicle_label: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  status: 'Pending' | 'Repairing' | 'Resolved';
  created_at: string;
  updated_at: string;
};

type Vehicle = { id: string; unit_number?: string | null; vin?: string | null };

type Driver = { id: string; name: string };

type Trailer = { id: string; trailer_number: string; vin: string | null; plate_number: string | null; assigned_driver_id: string | null };

type DriverIncident = {
  id: string;
  driver_id: string | null;
  incident_type: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

type Props = {
  orgId: string;
  initialIncidents: Incident[];
  vehicles: Vehicle[];
  canManageRoadside?: boolean;
  drivers?: Driver[];
  trailers?: Trailer[];
  driverIncidents?: DriverIncident[];
};

const STATUS_OPTIONS = ['Pending', 'Repairing', 'Resolved'] as const;

export function RoadsideIncidentClient({
  orgId,
  initialIncidents,
  vehicles,
  canManageRoadside = false,
  drivers = [],
  trailers = [],
  driverIncidents = [],
}: Props) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Repairing' | 'Resolved'>('Pending');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [submitError, setSubmitError] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const fetchIncidents = async () => {
    const res = await fetch('/api/breakdown-incidents');
    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data.incidents)) setIncidents(data.incidents);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const desc = description.trim();
    if (!desc) return;
    setLoading(true);
    setSubmitError('');
    const payload = {
      description: desc,
      status,
      vehicle_id: vehicleId || null,
      vehicle_label: vehicleLabel.trim() || null,
      latitude: lat ? parseFloat(lat) : null,
      longitude: lng ? parseFloat(lng) : null,
    };
    const res = await fetch('/api/breakdown-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setSubmitError(data.error ?? 'Failed to create incident');
      return;
    }
    setModalOpen(false);
    setDescription('');
    setStatus('Pending');
    setVehicleId('');
    setVehicleLabel('');
    setLat('');
    setLng('');
    fetchIncidents();
  };

  const handleStatusChange = async (incidentId: string, newStatus: 'Pending' | 'Repairing' | 'Resolved') => {
    const res = await fetch(`/api/breakdown-incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchIncidents();
  };

  const vehicleDisplay = (inc: Incident) => {
    if (inc.vehicle_label) return inc.vehicle_label;
    if (inc.vehicle_id) {
      const v = vehicles.find((x) => x.id === inc.vehicle_id);
      return v?.unit_number || v?.vin || inc.vehicle_id.slice(0, 8) || '—';
    }
    return '—';
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  const selectedDriver = selectedDriverId ? drivers.find((d) => d.id === selectedDriverId) : null;
  const driverTrailers = selectedDriverId ? trailers.filter((t) => t.assigned_driver_id === selectedDriverId) : [];
  const driverLogs = selectedDriverId ? driverIncidents.filter((i) => i.driver_id === selectedDriverId) : [];

  return (
    <div className="space-y-6">
      {/* Driver & trailer overview: visible to everyone in the org */}
      <div className="rounded-xl border border-white/10 bg-card p-4">
        <h2 className="text-lg font-semibold text-soft-cloud mb-3">Driver & trailer overview</h2>
        <p className="text-sm text-soft-cloud/70 mb-3">
          Select a driver to see their assigned trailer and roadside reports. Driver view (DOT Inspection, Call Dispatch, Find Truck Stop, Report Incident):{' '}
          <Link href="/driver/roadside-shield" className="text-cyber-amber hover:underline">
            Open Driver Roadside
          </Link>
        </p>
        {drivers.length === 0 ? (
          <p className="text-sm text-soft-cloud/60">
            No drivers in this organization yet. Add drivers from <Link href="/drivers" className="text-cyber-amber hover:underline">Drivers</Link> or connect an ELD in <Link href="/dashboard/integrations" className="text-cyber-amber hover:underline">Integrations</Link>, then assign trailers on the <Link href="/trailers" className="text-cyber-amber hover:underline">Trailers</Link> page.
          </p>
        ) : (
          <>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full max-w-sm px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
            >
              <option value="">— Choose a driver —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {selectedDriver && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-cyber-amber flex items-center gap-2 mb-2">
                    <Package className="size-4" />
                    Trailer
                  </h3>
                  {driverTrailers.length === 0 ? (
                    <p className="text-sm text-soft-cloud/60">No trailer assigned.</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-soft-cloud/90">
                      {driverTrailers.map((t) => (
                        <li key={t.id}>
                          {t.trailer_number}
                          {t.plate_number ? ` · Plate ${t.plate_number}` : ''}
                          {t.vin ? ` · VIN ${t.vin}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-cyber-amber flex items-center gap-2 mb-2">
                    <FileText className="size-4" />
                    Driver logs (roadside reports)
                  </h3>
                  {driverLogs.length === 0 ? (
                    <p className="text-sm text-soft-cloud/60">No roadside reports for this driver.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {driverLogs.map((log) => (
                        <li key={log.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <span className="font-medium text-soft-cloud">{log.incident_type}</span>
                          <span className="text-soft-cloud/60 ml-2">{formatDate(log.created_at)}</span>
                          {log.notes && <p className="text-soft-cloud/80 mt-1">{log.notes}</p>}
                          {log.latitude != null && log.longitude != null && (
                            <a
                              href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyber-amber hover:underline text-xs mt-1 inline-block"
                            >
                              View location
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-soft-cloud">Incident Management</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
        >
          <Plus className="size-5" />
          Log New Incident
        </button>
      </div>
      <p className="text-sm text-soft-cloud/70">
        Log and manage fleet breakdowns. Use the section above to view a driver&apos;s trailer and roadside reports.
      </p>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <h2 className="px-4 py-3 border-b border-white/10 text-lg font-semibold text-soft-cloud">
          Active Breakdowns
        </h2>
        {incidents.length === 0 ? (
          <p className="p-6 text-soft-cloud/60 text-sm">No incidents yet. Click &quot;Log New Incident&quot; to add one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-soft-cloud">{vehicleDisplay(inc)}</td>
                    <td className="px-4 py-3 text-soft-cloud/90">{inc.description}</td>
                    <td className="px-4 py-3">
                      <select
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value as 'Pending' | 'Repairing' | 'Resolved')}
                        className="bg-deep-ink border border-white/10 rounded px-2 py-1 text-soft-cloud text-sm"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-soft-cloud/70">{formatDate(inc.created_at)}</td>
                    <td className="px-4 py-3">
                      {inc.latitude != null && inc.longitude != null && (
                        <a
                          href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyber-amber hover:underline text-xs"
                        >
                          View location
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-soft-cloud/60">
        <Link href="/dashboard" className="text-cyber-amber hover:underline">← Back to dashboard</Link>
      </p>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-labelledby="log-incident-title"
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl">
            <h2 id="log-incident-title" className="text-lg font-semibold text-soft-cloud mb-4">
              Log New Incident
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Flat Tire"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Pending' | 'Repairing' | 'Resolved')}
                  className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Truck / Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    const v = vehicles.find((x) => x.id === e.target.value);
                    setVehicleLabel(v?.unit_number || v?.vin || '');
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                >
                  <option value="">— Select vehicle —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.unit_number || v.vin || v.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Location (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                  />
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Longitude"
                    className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                  />
                </div>
                <p className="text-xs text-soft-cloud/50 mt-1">Pin from Live Map or enter coordinates.</p>
              </div>
              {submitError && <p className="text-sm text-red-400">{submitError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
