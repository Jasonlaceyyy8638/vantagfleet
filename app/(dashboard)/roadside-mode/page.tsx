import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { RoadsideIncidentClient } from './RoadsideIncidentClient';

const MANAGER_ROLES = ['Owner', 'Safety_Manager', 'Dispatcher', 'Driver_Manager'];

export default async function RoadsideModePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? null;
  const canManageRoadside = role != null && MANAGER_ROLES.includes(role);

  const [
    { data: incidents },
    { data: vehicles },
    { data: drivers },
    { data: trailers },
    { data: driverReports },
  ] = await Promise.all([
    supabase
      .from('breakdown_incidents')
      .select('id, vehicle_id, vehicle_label, latitude, longitude, description, status, created_at, updated_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('vehicles')
      .select('id, unit_number, vin')
      .eq('org_id', orgId)
      .order('vin'),
    supabase.from('drivers').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('trailers').select('id, trailer_number, vin, plate_number, assigned_driver_id').eq('org_id', orgId),
    supabase
      .from('roadside_incident_reports')
      .select('id, driver_id, incident_type, notes, latitude, longitude, created_at')
      .eq('org_id', orgId)
      .not('driver_id', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  const incidentList = (incidents ?? []).map((r) => ({
    id: r.id,
    vehicle_id: (r as { vehicle_id?: string | null }).vehicle_id ?? null,
    vehicle_label: (r as { vehicle_label?: string | null }).vehicle_label ?? null,
    latitude: (r as { latitude?: number | null }).latitude ?? null,
    longitude: (r as { longitude?: number | null }).longitude ?? null,
    description: (r as { description: string }).description,
    status: (r as { status: string }).status as 'Pending' | 'Repairing' | 'Resolved',
    created_at: (r as { created_at: string }).created_at,
    updated_at: (r as { updated_at: string }).updated_at,
  }));

  const vehicleList = (vehicles ?? []).map((v) => ({
    id: (v as { id: string }).id,
    unit_number: (v as { unit_number?: string | null }).unit_number ?? null,
    vin: (v as { vin?: string | null }).vin ?? null,
  }));

  const driverList = (drivers ?? []).map((d) => ({
    id: (d as { id: string }).id,
    name: (d as { name?: string | null }).name ?? 'Unknown',
  }));

  const trailerList = (trailers ?? []).map((t) => ({
    id: (t as { id: string }).id,
    trailer_number: (t as { trailer_number: string }).trailer_number,
    vin: (t as { vin?: string | null }).vin ?? null,
    plate_number: (t as { plate_number?: string | null }).plate_number ?? null,
    assigned_driver_id: (t as { assigned_driver_id?: string | null }).assigned_driver_id ?? null,
  }));

  const driverIncidentList = (driverReports ?? []).map((r) => ({
    id: (r as { id: string }).id,
    driver_id: (r as { driver_id?: string | null }).driver_id ?? null,
    incident_type: (r as { incident_type: string }).incident_type,
    notes: (r as { notes?: string | null }).notes ?? null,
    latitude: (r as { latitude?: number | null }).latitude ?? null,
    longitude: (r as { longitude?: number | null }).longitude ?? null,
    created_at: (r as { created_at: string }).created_at,
  }));

  return (
    <div className="p-6 md:p-8 max-w-4xl overflow-x-hidden min-h-0">
      <RoadsideIncidentClient
        orgId={orgId}
        initialIncidents={incidentList}
        vehicles={vehicleList}
        canManageRoadside={canManageRoadside}
        drivers={driverList}
        trailers={trailerList}
        driverIncidents={driverIncidentList}
      />
    </div>
  );
}
