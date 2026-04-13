import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId, isSuperAdminImpersonating } from '@/lib/admin';
import { cookies } from 'next/headers';
import { hasFullAccess } from '@/lib/userHasAccess';
import { UpgradeOverlay } from '@/components/UpgradeOverlay';
import { FleetClient } from '@/app/(dashboard)/dashboard/fleet/FleetClient';
import { resolveDemoPage } from '@/src/constants/demoData';
import { VehiclesSandboxView } from '@/src/components/demo/VehiclesSandboxView';

export default async function VehiclesPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    const role = cookieStore.get('vf_demo_role')?.value === 'broker' ? 'broker' : 'carrier';
    const payload = resolveDemoPage(role, 'vehicles') as {
      drivers: { id: string; name: string; assigned_vehicle_id: string | null; status: string }[];
      vehicles: { id: string; vin: string; plate: string; year: number | null; status: string }[];
    };
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-soft-cloud mb-2">Vehicles</h1>
        <p className="text-soft-cloud/70 mb-6">
          Add vehicles (with VIN decoder), assign drivers, and manage your fleet. Unassigned drivers appear in the Pool; archive or reactivate as needed.
        </p>
        <VehiclesSandboxView drivers={payload.drivers} vehicles={payload.vehicles} />
      </div>
    );
  }

  const supabase = await createClient();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-soft-cloud mb-2">Vehicles</h1>
        <p className="text-soft-cloud/70">No organization selected.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  const [
    { data: drivers },
    { data: vehicles },
    { data: profile },
    { data: org },
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
    user
      ? supabase
          .from('profiles')
          .select('is_beta_tester, beta_expires_at, ifta_enabled')
          .eq('user_id', user.id)
          .eq('org_id', orgId)
          .single()
      : { data: null },
    supabase.from('organizations').select('subscription_status').eq('id', orgId).single(),
  ]);

  const profileData = profile as { is_beta_tester?: boolean; beta_expires_at?: string | null; ifta_enabled?: boolean } | null;
  const orgData = org as { subscription_status?: string | null } | null;
  const adminImpersonating = await isSuperAdminImpersonating(supabase, cookieStore);
  const hasAccess = adminImpersonating || hasFullAccess(profileData, orgData);

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
    <UpgradeOverlay hasAccess={hasAccess} title="VIN Decoder & Fleet">
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
    </UpgradeOverlay>
  );
}
