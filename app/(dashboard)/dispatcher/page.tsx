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

  const [
    { data: incidentRows },
    { data: profileRow },
    { data: receiptRows },
  ] = await Promise.all([
    supabase
      .from('roadside_incident_reports')
      .select('id, incident_type, notes, latitude, longitude, created_at')
      .eq('org_id', orgId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single(),
    supabase
      .from('ifta_receipts')
      .select('id, receipt_date, state, gallons, status')
      .eq('user_id', (profileRow as { id: string } | null)?.id ?? '')
      .eq('quarter', currentQuarter)
      .eq('year', year)
      .eq('status', 'pending')
      .order('receipt_date', { ascending: false }),
  ]);

  const initialIncidents = (incidentRows ?? []).map((r) => ({
    id: (r as { id: string }).id,
    incident_type: (r as { incident_type: string }).incident_type,
    notes: (r as { notes?: string | null }).notes ?? null,
    latitude: (r as { latitude?: number | null }).latitude ?? null,
    longitude: (r as { longitude?: number | null }).longitude ?? null,
    created_at: (r as { created_at: string }).created_at,
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
