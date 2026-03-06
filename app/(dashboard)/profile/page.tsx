import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { DriverProfileClient } from './DriverProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, profile_image_url, driver_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? null;
  if (role === 'Dispatcher' || role === 'Driver_Manager') {
    redirect('/dispatcher/profile');
  }

  const profileId = (profile as { id: string } | null)?.id ?? '';
  const fullName = (profile as { full_name?: string | null })?.full_name ?? null;
  const phone = (profile as { phone?: string | null })?.phone ?? null;
  const profileImageUrl = (profile as { profile_image_url?: string | null })?.profile_image_url ?? null;
  const driverId = (profile as { driver_id?: string | null })?.driver_id ?? null;

  let assignedTruckNumber: string | null = null;
  if (driverId) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('assigned_vehicle_id')
      .eq('id', driverId)
      .single();
    const vehicleId = (driver as { assigned_vehicle_id?: string | null })?.assigned_vehicle_id;
    if (vehicleId) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('unit_number')
        .eq('id', vehicleId)
        .single();
      assignedTruckNumber = (vehicle as { unit_number?: string | null })?.unit_number ?? null;
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();
  const { count } = await supabase
    .from('roadside_incident_reports')
    .select('id', { count: 'exact', head: true })
    .eq('reported_by_user_id', user.id)
    .eq('org_id', orgId)
    .gte('created_at', sinceIso);
  const incidentsLast30 = count ?? 0;
  const daysIncidentFree = incidentsLast30 === 0 ? 30 : 0;

  return (
    <DriverProfileClient
      profileId={profileId}
      orgId={orgId}
      fullName={fullName}
      phone={phone}
      profileImageUrl={profileImageUrl}
      assignedTruckNumber={assignedTruckNumber}
      daysIncidentFree={daysIncidentFree}
    />
  );
}
