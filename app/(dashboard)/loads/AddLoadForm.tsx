'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLoad, getMotiveMilesForQuarter } from '@/app/actions/loads';
import { Loader2, Plus, MapPin, Truck } from 'lucide-react';

const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

type SegmentRow = { id: string; state_code: string; miles_driven: string };

type Props = {
  orgId: string;
  hasMotive: boolean;
  drivers: { id: string; name: string }[];
  vehicles: { id: string; vin: string; plate: string }[];
};

function getQuarterFromDate(dateStr: string): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
  return { year, quarter };
}

export function AddLoadForm({ orgId, hasMotive, drivers, vehicles }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [loadDate, setLoadDate] = useState(today);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [revenueCents, setRevenueCents] = useState('');
  const [loadedMiles, setLoadedMiles] = useState('');
  const [deadheadMiles, setDeadheadMiles] = useState('');
  const [fuelCostCents, setFuelCostCents] = useState('');
  const [notes, setNotes] = useState('');
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [motiveLoading, setMotiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motiveError, setMotiveError] = useState<string | null>(null);

  const totalMiles = Number(loadedMiles || 0) + Number(deadheadMiles || 0);
  const segmentSum = segments.reduce((s, r) => s + Number(r.miles_driven || 0), 0);
  const segmentsMatch = totalMiles <= 0 || Math.abs(segmentSum - totalMiles) < 0.01;

  function addSegment() {
    setSegments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), state_code: 'OH', miles_driven: '' },
    ]);
  }

  function removeSegment(id: string) {
    setSegments((prev) => prev.filter((r) => r.id !== id));
  }

  function updateSegment(id: string, field: 'state_code' | 'miles_driven', value: string) {
    setSegments((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  async function handleFetchFromMotive() {
    if (!loadDate) return;
    setMotiveError(null);
    setMotiveLoading(true);
    try {
      const { year, quarter } = getQuarterFromDate(loadDate);
      const result = await getMotiveMilesForQuarter(orgId, year, quarter);
      if (!result.ok) {
        setMotiveError(result.error);
        return;
      }
      if (result.milesByState.length === 0) {
        setMotiveError('No mileage data from Motive for this quarter.');
        return;
      }
      const totalFromMotive = result.totalMiles;
      const scale = totalMiles > 0 && totalFromMotive > 0 ? totalMiles / totalFromMotive : 1;
      const newSegments: SegmentRow[] = result.milesByState.map(({ state_code, miles }) => ({
        id: crypto.randomUUID(),
        state_code,
        miles_driven: (miles * scale).toFixed(1),
      }));
      setSegments(newSegments);
    } finally {
      setMotiveLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!segmentsMatch && segments.length > 0) {
      setError(`Segment total (${segmentSum.toFixed(1)} mi) must match total miles (${totalMiles.toFixed(1)} mi).`);
      return;
    }
    setSubmitLoading(true);
    try {
      const result = await createLoad(orgId, {
        load_date: loadDate,
        driver_id: driverId || null,
        vehicle_id: vehicleId || null,
        revenue_cents: Math.round(Number(revenueCents || 0) * 100),
        deadhead_miles: Number(deadheadMiles || 0),
        loaded_miles: loadedMiles.trim() ? Number(loadedMiles) : undefined,
        fuel_cost_cents: Math.round(Number(fuelCostCents || 0) * 100),
        notes: notes.trim() || null,
        segments: segments
          .filter((s) => s.state_code && Number(s.miles_driven) > 0)
          .map((s) => ({ state_code: s.state_code, miles_driven: Number(s.miles_driven) })),
      });
      if (result.ok) {
        setLoadDate(today);
        setDriverId('');
        setVehicleId('');
        setRevenueCents('');
        setLoadedMiles('');
        setDeadheadMiles('');
        setFuelCostCents('');
        setNotes('');
        setSegments([]);
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-card p-6 space-y-6">
      <h2 className="text-lg font-semibold text-soft-cloud flex items-center gap-2">
        <Truck className="size-5" />
        Add Load
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Load date</span>
          <input
            type="date"
            value={loadDate}
            onChange={(e) => setLoadDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Driver</span>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          >
            <option value="">— Select —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Vehicle</span>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          >
            <option value="">— Select —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.vin || v.plate || v.id.slice(0, 8)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Revenue ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={revenueCents}
            onChange={(e) => setRevenueCents(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Loaded miles</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={loadedMiles}
            onChange={(e) => setLoadedMiles(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Deadhead miles</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={deadheadMiles}
            onChange={(e) => setDeadheadMiles(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-soft-cloud/70">Fuel cost ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fuelCostCents}
            onChange={(e) => setFuelCostCents(e.target.value)}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          />
        </label>
      </div>
      <p className="text-sm text-soft-cloud/60">Total miles = Loaded + Deadhead = {totalMiles.toFixed(1)} mi</p>

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm font-medium text-soft-cloud mb-2 flex items-center gap-2">
          <MapPin className="size-4" />
          IFTA Mileage Breakdown
        </h3>
        <p className="text-xs text-soft-cloud/50 mb-3">
          Segment miles must equal total miles above. Add state-by-state miles for IFTA reporting.
        </p>
        {hasMotive && (
          <button
            type="button"
            onClick={handleFetchFromMotive}
            disabled={motiveLoading || totalMiles <= 0}
            className="mb-3 px-3 py-1.5 rounded-lg bg-electric-teal/20 text-electric-teal text-sm font-medium hover:bg-electric-teal/30 disabled:opacity-50 flex items-center gap-2"
          >
            {motiveLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Fetch Miles from Motive
          </button>
        )}
        {motiveError && <p className="text-amber-400 text-sm mb-2">{motiveError}</p>}
        <div className="space-y-2">
          {segments.map((row) => (
            <div key={row.id} className="flex flex-wrap gap-2 items-center">
              <select
                value={row.state_code}
                onChange={(e) => updateSegment(row.id, 'state_code', e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm w-24"
              >
                {US_STATE_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={row.miles_driven}
                onChange={(e) => updateSegment(row.id, 'miles_driven', e.target.value)}
                placeholder="Miles"
                className="px-2 py-1.5 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm w-24"
              />
              <span className="text-soft-cloud/50 text-sm">mi</span>
              <button
                type="button"
                onClick={() => removeSegment(row.id)}
                className="text-soft-cloud/50 hover:text-red-400 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSegment}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-electric-teal hover:underline"
        >
          <Plus className="size-4" />
          Add State
        </button>
        {segments.length > 0 && (
          <p className={`text-sm mt-2 ${segmentsMatch ? 'text-soft-cloud/60' : 'text-amber-400'}`}>
            Segment total: {segmentSum.toFixed(1)} mi
            {!segmentsMatch && ` — must equal ${totalMiles.toFixed(1)} mi`}
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-soft-cloud/70">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm resize-none"
        />
      </label>

      {error && <p className="text-amber-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitLoading}
        className="px-4 py-2 rounded-lg bg-electric-teal/20 text-electric-teal font-medium hover:bg-electric-teal/30 disabled:opacity-50 flex items-center gap-2"
      >
        {submitLoading ? <Loader2 className="size-4 animate-spin" /> : null}
        Save Load
      </button>
    </form>
  );
}
