import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { RoadsideIncidentClient } from './RoadsideIncidentClient';

export default async function RoadsideModePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const [
    { data: incidents },
    { data: vehicles },
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

  return (
    <div className="p-6 md:p-8 max-w-4xl overflow-x-hidden min-h-0">
      <RoadsideIncidentClient
        orgId={orgId}
        initialIncidents={incidentList}
        vehicles={vehicleList}
      />
    </div>
  );
}
