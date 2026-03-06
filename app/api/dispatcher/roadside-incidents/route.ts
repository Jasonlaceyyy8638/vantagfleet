import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';

/** GET: all roadside incident reports for the current org (dispatcher/org members). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const { data: rows, error } = await supabase
    .from('roadside_incident_reports')
    .select('id, incident_type, notes, latitude, longitude, created_at, reported_by_user_id, driver_id')
    .eq('org_id', orgId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const reports = (rows ?? []) as Array<{
    id: string;
    incident_type: string;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    reported_by_user_id: string;
    driver_id: string | null;
  }>;

  const userIds = [...new Set(reports.map((r) => r.reported_by_user_id))];
  const driverIds = [...new Set(reports.map((r) => r.driver_id).filter(Boolean))] as string[];

  let profileByUser: Record<string, { profile_image_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, profile_image_url')
      .eq('org_id', orgId)
      .in('user_id', userIds);
    for (const p of profiles ?? []) {
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
    const vehicleIds = [...new Set((drivers ?? []).map((d) => (d as { assigned_vehicle_id: string | null }).assigned_vehicle_id).filter(Boolean))] as string[];
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

  const reportsWithDriver = reports.map((r) => ({
    id: r.id,
    incident_type: r.incident_type,
    notes: r.notes,
    latitude: r.latitude,
    longitude: r.longitude,
    created_at: r.created_at,
    driver_profile_image_url: profileByUser[r.reported_by_user_id]?.profile_image_url ?? null,
    driver_truck_number: r.driver_id ? truckByDriver[r.driver_id] ?? null : null,
  }));

  return NextResponse.json({ reports: reportsWithDriver });
}
