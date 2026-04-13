'use client';

import { Truck, User } from 'lucide-react';

type DriverRow = { id: string; name: string; assigned_vehicle_id: string | null; status: string };
type VehicleRow = { id: string; vin: string; plate: string; year: number | null; status: string };

export function VehiclesSandboxView({
  drivers,
  vehicles,
}: {
  drivers: DriverRow[];
  vehicles: VehicleRow[];
}) {
  const assigned = drivers.filter((d) => d.assigned_vehicle_id != null && d.status === 'active');
  const pool = drivers.filter((d) => d.assigned_vehicle_id == null && d.status === 'active');

  return (
    <div className="space-y-8">
      <p className="text-sm text-cyber-amber/90 border border-cyber-amber/30 rounded-lg px-3 py-2 bg-cyber-amber/5">
        Interactive sandbox — sample fleet assignments. VIN decode and saves are disabled.
      </p>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
            <Truck className="size-4" />
            Vehicles
          </h2>
        </div>
        <ul className="divide-y divide-white/10">
          {vehicles.map((v) => (
            <li key={v.id} className="px-5 py-3 flex flex-wrap gap-4 text-sm text-soft-cloud/90">
              <span className="font-mono text-cyber-amber/90">{v.vin}</span>
              <span>{v.plate}</span>
              <span className="text-soft-cloud/60">{v.year ?? '—'}</span>
              <span className="text-emerald-400/90 capitalize">{v.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
            <User className="size-4" />
            Assigned drivers
          </h2>
        </div>
        <ul className="divide-y divide-white/10">
          {assigned.length === 0 ? (
            <li className="px-5 py-6 text-center text-soft-cloud/50 text-sm">No assignments in this sample.</li>
          ) : (
            assigned.map((d) => {
              const v = vehicles.find((x) => x.id === d.assigned_vehicle_id);
              return (
                <li key={d.id} className="px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-soft-cloud w-44 truncate">{d.name}</span>
                  <span className="text-soft-cloud/50">→</span>
                  <span className="text-soft-cloud/80">{v ? `${v.plate} (${v.vin.slice(-6)})` : '—'}</span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {pool.length > 0 && (
        <section className="rounded-xl border border-cyber-amber/20 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-soft-cloud">Pool (unassigned)</h2>
          </div>
          <ul className="divide-y divide-white/10">
            {pool.map((d) => (
              <li key={d.id} className="px-5 py-3 text-sm text-soft-cloud/80">
                {d.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
