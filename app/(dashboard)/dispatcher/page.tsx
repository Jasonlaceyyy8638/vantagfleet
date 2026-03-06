import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { DispatcherDashboardClient } from './DispatcherDashboardClient';

export default async function DispatcherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId);

  const currentRole = (profiles ?? [])[0] as { role?: string } | undefined;
  const role = currentRole?.role ?? null;

  if (role === 'Driver') {
    redirect('/driver/roadside-shield');
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const profileId = (profileRow as { id: string } | null)?.id ?? '';

  const [
    { data: incidentRows },
    { data: receiptRows },
  ] = await Promise.all([
    supabase
      .from('roadside_incident_reports')
      .select('id, incident_type, notes, latitude, longitude, created_at, reported_by_user_id, driver_id')
      .eq('org_id', orgId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    supabase
      .from('ifta_receipts')
      .select('id, receipt_date, state, gallons, status')
      .eq('user_id', profileId)
      .eq('quarter', currentQuarter)
      .eq('year', year)
      .eq('status', 'pending')
      .order('receipt_date', { ascending: false }),
  ]);

  const reports = (incidentRows ?? []) as Array<{
    id: string;
    incident_type: string;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    reported_by_user_id: string;
    driver_id: string | null;
  }>;

  const userIds = Array.from(new Set(reports.map((r) => r.reported_by_user_id)));
  const driverIds = Array.from(new Set(reports.map((r) => r.driver_id).filter(Boolean))) as string[];

  let profileByUser: Record<string, { profile_image_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profilesForIncidents } = await supabase
      .from('profiles')
      .select('user_id, profile_image_url')
      .eq('org_id', orgId)
      .in('user_id', userIds);
    for (const p of profilesForIncidents ?? []) {
      const row = p as { user_id: string; profile_image_url: string | null };
      profileByUser[row.user_id] = { profile_image_url: row.profile_image_url };
    }
  }

  let truckByDriver: Record<string, string | null> = {};
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, assigned_vehicle_id')
      .in('id', driverIds);
    const vehicleIds = Array.from(new Set((drivers ?? []).map((d) => (d as { assigned_vehicle_id: string | null }).assigned_vehicle_id).filter(Boolean))) as string[];
    let vehicleUnit: Record<string, string | null> = {};
    if (vehicleIds.length > 0) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, unit_number')
        .in('id', vehicleIds);
      for (const v of vehicles ?? []) {
        const row = v as { id: string; unit_number: string | null };
        vehicleUnit[row.id] = row.unit_number;
      }
    }
    for (const d of drivers ?? []) {
      const row = d as { id: string; assigned_vehicle_id: string | null };
      truckByDriver[row.id] = row.assigned_vehicle_id ? vehicleUnit[row.assigned_vehicle_id] ?? null : null;
    }
  }

  const initialIncidents = reports.map((r) => ({
    id: r.id,
    incident_type: r.incident_type,
    notes: r.notes,
    latitude: r.latitude,
    longitude: r.longitude,
    created_at: r.created_at,
    driver_profile_image_url: profileByUser[r.reported_by_user_id]?.profile_image_url ?? null,
    driver_truck_number: r.driver_id ? truckByDriver[r.driver_id] ?? null : null,
  }));

  const pendingIfta = (receiptRows ?? []).map((r) => ({
    id: (r as { id: string }).id,
    receipt_date: (r as { receipt_date?: string | null }).receipt_date ?? null,
    state: (r as { state?: string | null }).state ?? null,
    gallons: (r as { gallons?: number | null }).gallons ?? null,
    status: (r as { status: string }).status,
  }));

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

  return (
    <DispatcherDashboardClient
      orgId={orgId}
      initialIncidents={initialIncidents}
      pendingIfta={pendingIfta}
      mapboxToken={mapboxToken}
    />
  );
}
