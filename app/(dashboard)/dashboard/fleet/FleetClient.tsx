'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addVehicle,
  setDriverAssignment,
  archiveDriver,
  reactivateDriver,
} from '@/app/actions/fleet';
import { Truck, User, Users, Archive, RotateCcw, Loader2, Sparkles } from 'lucide-react';

type Driver = {
  id: string;
  name: string;
  assigned_vehicle_id: string | null;
  status: string;
};

type Vehicle = {
  id: string;
  vin: string;
  plate: string;
  year: number | null;
  status: string;
};

type Props = {
  orgId: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  assignedDrivers: Driver[];
  poolDrivers: Driver[];
  archivedDrivers: Driver[];
};

export function FleetClient({
  orgId,
  drivers,
  vehicles,
  assignedDrivers,
  poolDrivers,
  archivedDrivers,
}: Props) {
  const router = useRouter();
  const [vin, setVin] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState<string>('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [decodeLoading, setDecodeLoading] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [vinLengthError, setVinLengthError] = useState<string | null>(null);
  const [iftaEligible, setIftaEligible] = useState(false);
  /** True when form fields are shown: after successful decode, manual entry click, or decode failure. */
  const [formRevealed, setFormRevealed] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const VIN_LENGTH = 17;
  const fallbackMessage = 'Vehicle details not found. Please enter details manually.';

  async function handleDecodeVin() {
    const v = vin.trim();
    if (!v) return;
    setVinLengthError(null);
    setDecodeError(null);
    setIftaEligible(false);
    if (v.length !== VIN_LENGTH) {
      setVinLengthError(`VIN must be exactly ${VIN_LENGTH} characters to decode.`);
      return;
    }
    setDecodeLoading(true);
    try {
      const res = await fetch(`/api/vin-decode?vin=${encodeURIComponent(v)}`);
      const data = await res.json();
      if (data.ok) {
        if (data.year != null) setYear(String(data.year));
        if (data.make != null) setMake(data.make);
        if (data.model != null) setModel(data.model);
        if (data.weightClass != null) setWeightClass(data.weightClass);
        if (data.fuelType != null) setFuelType(data.fuelType);
        setIftaEligible(!!data.iftaEligible);
        setFormRevealed(true);
      } else {
        setDecodeError(fallbackMessage);
        setFormRevealed(true);
      }
    } catch {
      setDecodeError(fallbackMessage);
      setFormRevealed(true);
    } finally {
      setDecodeLoading(false);
    }
  }

  function handleManualEntry() {
    setVinLengthError(null);
    setDecodeError(null);
    setFormRevealed(true);
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    try {
      const result = await addVehicle(orgId, {
        vin: vin.trim(),
        plate: plate.trim(),
        year: year.trim() ? parseInt(year, 10) : null,
        make: make.trim() || null,
        model: model.trim() || null,
        weight_class: weightClass.trim() || null,
        fuel_type: fuelType.trim() || null,
      });
      if (result.ok) {
        setVin('');
        setPlate('');
        setYear('');
        setMake('');
        setModel('');
        setWeightClass('');
        setFuelType('');
        setDecodeError(null);
        setVinLengthError(null);
        setIftaEligible(false);
        setFormRevealed(false);
        router.refresh();
      } else {
        setAddError(result.error);
      }
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAssignment(driverId: string, vehicleId: string | null) {
    setAssigningId(driverId);
    try {
      const result = await setDriverAssignment(orgId, driverId, vehicleId);
      if (result.ok) router.refresh();
    } finally {
      setAssigningId(null);
    }
  }

  async function handleArchive(driverId: string) {
    setArchivingId(driverId);
    try {
      const result = await archiveDriver(orgId, driverId);
      if (result.ok) router.refresh();
    } finally {
      setArchivingId(null);
    }
  }

  async function handleReactivate(driverId: string) {
    setReactivatingId(driverId);
    try {
      const result = await reactivateDriver(orgId, driverId);
      if (result.ok) router.refresh();
    } finally {
      setReactivatingId(null);
    }
  }

  const availableVehicles = vehicles.filter((v) => v.status === 'active');
  const getVehicleLabel = (v: Vehicle) =>
    [v.vin || 'No VIN', v.plate ? `Plate: ${v.plate}` : null, v.year ? `${v.year}` : null]
      .filter(Boolean)
      .join(' · ') || v.id.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Add Vehicle */}
      <section className="rounded-xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4 flex items-center gap-2">
          <Truck className="size-5" />
          Add Vehicle
        </h2>
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-soft-cloud/70">VIN <span className="text-amber-400/80">*</span></span>
              <input
                type="text"
                value={vin}
                onChange={(e) => {
                  setVin(e.target.value);
                  setDecodeError(null);
                  setVinLengthError(null);
                }}
                placeholder="17-character VIN"
                maxLength={17}
                className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[200px]"
              />
            </label>
            <button
              type="button"
              onClick={handleDecodeVin}
              disabled={decodeLoading || !vin.trim() || addLoading}
              className="px-4 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium hover:bg-cyber-amber/30 disabled:opacity-50 flex items-center gap-2"
            >
              {decodeLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {decodeLoading ? 'Decoding…' : 'Decode VIN'}
            </button>
          </div>
          <p className="text-xs text-soft-cloud/50">
            VIN required for audit. Decode requires exactly 17 characters.
          </p>
          <button
            type="button"
            onClick={handleManualEntry}
            className="text-sm text-soft-cloud/70 hover:text-electric-teal underline underline-offset-2"
          >
            Skip Auto-fill / Manual Entry
          </button>
          {vinLengthError && (
            <p className="text-amber-400 text-sm">{vinLengthError}</p>
          )}
          {decodeError && (
            <p className="text-amber-400 text-sm">{decodeError}</p>
          )}
          {iftaEligible && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-electric-teal/20 px-2.5 py-1 text-sm font-medium text-electric-teal">
              <Sparkles className="size-4" />
              IFTA Eligible
            </span>
          )}

          {formRevealed && (
            <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-white/10 mt-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-soft-cloud/70">Year</span>
                <input
                  type="number"
                  min={1990}
                  max={2030}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Year"
                  className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm w-24"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-soft-cloud/70">Make</span>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Make"
                  className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[120px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-soft-cloud/70">Model</span>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model"
                  className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[120px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-soft-cloud/70">Weight class (GVWR)</span>
                <input
                  type="text"
                  value={weightClass}
                  onChange={(e) => setWeightClass(e.target.value)}
                  placeholder="e.g. Class 8"
                  className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[180px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-soft-cloud/70">Fuel type</span>
                <input
                  type="text"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  placeholder="e.g. Diesel"
                  className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[100px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-soft-cloud/70">Plate</span>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="License plate"
                  className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[120px]"
                />
              </label>
              <button
                type="submit"
                disabled={addLoading || !vin.trim()}
                className="px-4 py-2 rounded-lg bg-electric-teal/20 text-electric-teal font-medium hover:bg-electric-teal/30 disabled:opacity-50 flex items-center gap-2"
              >
                {addLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                Add Vehicle
              </button>
            </div>
          )}
        </form>
        {addError && (
          <p className="text-amber-400 text-sm mt-2">{addError}</p>
        )}
      </section>

      {/* Assigned drivers: dropdown of available vehicles + Unassign */}
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
            <Truck className="size-4" />
            Assigned drivers
          </h2>
          <p className="text-xs text-soft-cloud/60 mt-0.5">Assign or unassign a vehicle per driver.</p>
        </div>
        <ul className="divide-y divide-white/10">
          {assignedDrivers.length === 0 ? (
            <li className="px-5 py-6 text-center text-soft-cloud/50 text-sm">No assigned drivers. Assign from the Pool below.</li>
          ) : (
            assignedDrivers.map((d) => {
              const isLoading = assigningId === d.id;
              const currentVehicle = vehicles.find((v) => v.id === d.assigned_vehicle_id);
              return (
                <li key={d.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                  <span className="font-medium text-soft-cloud w-40 truncate flex items-center gap-1.5">
                    <User className="size-4 text-soft-cloud/60" />
                    {d.name}
                  </span>
                  <span className="text-soft-cloud/50 text-sm">→</span>
                  <select
                    value={d.assigned_vehicle_id ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleAssignment(d.id, val === '' ? null : val);
                    }}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[200px]"
                  >
                    <option value="">— Unassign —</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {getVehicleLabel(v)}
                      </option>
                    ))}
                  </select>
                  {isLoading && <Loader2 className="size-4 animate-spin text-soft-cloud/60" />}
                  {currentVehicle && (
                    <span className="text-xs text-soft-cloud/50">
                      {getVehicleLabel(currentVehicle)}
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Pool: unassigned drivers — assign or archive */}
      <section className="rounded-xl border border-cyber-amber/20 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
            <Users className="size-4" />
            Pool (unassigned drivers)
          </h2>
          <p className="text-xs text-soft-cloud/60 mt-0.5">Assign a vehicle or archive when a driver quits.</p>
        </div>
        <ul className="divide-y divide-white/10">
          {poolDrivers.length === 0 ? (
            <li className="px-5 py-6 text-center text-soft-cloud/50 text-sm">No unassigned drivers in the pool.</li>
          ) : (
            poolDrivers.map((d) => {
              const isLoadingAssign = assigningId === d.id;
              const isLoadingArchive = archivingId === d.id;
              return (
                <li key={d.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                  <span className="font-medium text-soft-cloud w-40 truncate flex items-center gap-1.5">
                    <User className="size-4 text-soft-cloud/60" />
                    {d.name}
                  </span>
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) handleAssignment(d.id, val);
                    }}
                    disabled={isLoadingAssign}
                    className="px-3 py-1.5 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm min-w-[200px]"
                  >
                    <option value="">Available vehicles…</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {getVehicleLabel(v)}
                      </option>
                    ))}
                  </select>
                  {isLoadingAssign && <Loader2 className="size-4 animate-spin text-soft-cloud/60" />}
                  <button
                    type="button"
                    onClick={() => handleArchive(d.id)}
                    disabled={isLoadingArchive}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 text-amber-400 px-2.5 py-1.5 text-sm font-medium hover:bg-amber-500/25"
                  >
                    {isLoadingArchive ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                    Archive
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Archived: reactivate */}
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
            <Archive className="size-4" />
            Archived (quit / left)
          </h2>
          <p className="text-xs text-soft-cloud/60 mt-0.5">Reactivate to move them back to the Pool.</p>
        </div>
        <ul className="divide-y divide-white/10">
          {archivedDrivers.length === 0 ? (
            <li className="px-5 py-6 text-center text-soft-cloud/50 text-sm">No archived drivers.</li>
          ) : (
            archivedDrivers.map((d) => {
              const isLoading = reactivatingId === d.id;
              return (
                <li key={d.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                  <span className="font-medium text-soft-cloud/80 w-40 truncate flex items-center gap-1.5">
                    <User className="size-4 text-soft-cloud/50" />
                    {d.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReactivate(d.id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-electric-teal/15 text-electric-teal px-2.5 py-1.5 text-sm font-medium hover:bg-electric-teal/25"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    Reactivate
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
