import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId, isSuperAdminImpersonating } from '@/lib/admin';
import { canSeeMap } from '@/lib/userHasAccess';
import { DispatchCommandCenterClient } from '@/components/DispatchCommandCenterClient';
import { getDispatchDemoSnapshot } from '@/src/constants/demoData';

export default async function DispatchPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    const role = cookieStore.get('vf_demo_role')?.value === 'broker' ? 'broker' : 'carrier';
    const snap = getDispatchDemoSnapshot(role);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <DispatchCommandCenterClient
          orgId={snap.orgId}
          mapboxToken={mapboxToken}
          mapAccess
          demoMode
          brokerMode={role === 'broker'}
          initialLoads={snap.initialLoads}
          drivers={snap.drivers}
          vehicles={snap.vehicles}
          customers={snap.customers}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-cloud-dancer/70">No organization selected.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const [{ data: profileRow }, { data: orgRow }] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_beta_tester, account_type')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single(),
    supabase.from('organizations').select('tier, business_type').eq('id', orgId).single(),
  ]);

  const profile = profileRow as { is_beta_tester?: boolean; account_type?: string | null } | null;
  const org = orgRow as { tier?: string | null; business_type?: string | null } | null;
  const isBrokerOrg =
    org?.business_type === 'broker' || profile?.account_type === 'broker';
  const adminImpersonating = await isSuperAdminImpersonating(supabase, cookieStore);
  const mapAccess = adminImpersonating || canSeeMap(profile, org);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';

  const [
    { data: loadsRaw },
    { data: drivers },
    { data: vehicles },
    { data: customers },
  ] = await Promise.all([
    supabase
      .from('loads')
      .select('id, load_date, status, reference_number, driver_id, vehicle_id')
      .eq('org_id', orgId)
      .order('load_date', { ascending: false })
      .limit(80),
    supabase
      .from('drivers')
      .select('id, name, med_card_expiry, compliance_status, status')
      .eq('org_id', orgId)
      .order('name'),
    supabase
      .from('vehicles')
      .select('id, unit_number, annual_inspection_due')
      .eq('org_id', orgId)
      .order('unit_number'),
    supabase.from('customers').select('id, name').eq('org_id', orgId).order('name'),
  ]);

  const loadList = loadsRaw ?? [];
  const loadIds = loadList.map((l) => l.id);
  const { data: stopsRows } =
    loadIds.length > 0
      ? await supabase
          .from('load_stops')
          .select('id, load_id, sequence_order, stop_type, location_name, city, state, latitude, longitude')
          .in('load_id', loadIds)
          .order('sequence_order')
      : { data: [] };

  const stopsByLoad = new Map<string, typeof stopsRows>();
  for (const row of stopsRows ?? []) {
    const lid = row.load_id as string;
    const arr = stopsByLoad.get(lid) ?? [];
    arr.push(row);
    stopsByLoad.set(lid, arr);
  }

  const driverById = new Map((drivers ?? []).map((d) => [d.id, d]));
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  const initialLoads = loadList.map((l) => ({
    ...l,
    load_stops: stopsByLoad.get(l.id) ?? [],
    driver_name: l.driver_id ? driverById.get(l.driver_id)?.name ?? null : null,
    vehicle_label: l.vehicle_id ? vehicleById.get(l.vehicle_id)?.unit_number ?? null : null,
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <DispatchCommandCenterClient
        orgId={orgId}
        mapboxToken={mapboxToken}
        mapAccess={mapAccess}
        brokerMode={isBrokerOrg}
        initialLoads={initialLoads}
        drivers={drivers ?? []}
        vehicles={vehicles ?? []}
        customers={customers ?? []}
      />
    </div>
  );
}
