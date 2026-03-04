import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { FleetClient } from '@/app/(dashboard)/dashboard/fleet/FleetClient';

export default async function VehiclesPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-soft-cloud mb-2">Vehicles</h1>
        <p className="text-soft-cloud/70">No organization selected.</p>
      </div>
    );
  }

  const [
    { data: drivers },
    { data: vehicles },
  ] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, name, assigned_vehicle_id, status')
      .eq('org_id', orgId)
      .order('name'),
    supabase
      .from('vehicles')
      .select('id, vin, plate, year, status')
      .eq('org_id', orgId)
      .order('vin'),
  ]);

  const driverList = (drivers ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    assigned_vehicle_id: (d as { assigned_vehicle_id?: string | null }).assigned_vehicle_id ?? null,
    status: (d as { status?: string | null }).status ?? 'active',
  }));

  const vehicleList = (vehicles ?? []).map((v) => ({
    id: v.id,
    vin: v.vin ?? '',
    plate: v.plate ?? '',
    year: (v as { year?: number | null }).year ?? null,
    status: (v as { status?: string | null }).status ?? 'active',
  }));

  const assigned = driverList.filter((d) => d.assigned_vehicle_id != null && d.status === 'active');
  const pool = driverList.filter((d) => d.assigned_vehicle_id == null && d.status === 'active');
  const archived = driverList.filter((d) => d.status === 'archived');

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Vehicles</h1>
      <p className="text-soft-cloud/70 mb-6">
        Add vehicles (with VIN decoder), assign drivers, and manage your fleet. Unassigned drivers appear in the Pool; archive or reactivate as needed.
      </p>
      <FleetClient
        orgId={orgId}
        drivers={driverList}
        vehicles={vehicleList}
        assignedDrivers={assigned}
        poolDrivers={pool}
        archivedDrivers={archived}
      />
    </div>
  );
}
