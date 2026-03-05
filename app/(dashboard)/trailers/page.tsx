import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { TrailersClient } from './TrailersClient';

export default async function TrailersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const [
    { data: trailers },
    { data: drivers },
  ] = await Promise.all([
    supabase
      .from('trailers')
      .select('id, trailer_number, vin, plate_number, assigned_driver_id, created_at')
      .eq('org_id', orgId)
      .order('trailer_number'),
    supabase
      .from('drivers')
      .select('id, name')
      .eq('org_id', orgId)
      .order('name'),
  ]);

  const trailerList = (trailers ?? []).map((t) => ({
    id: (t as { id: string }).id,
    trailer_number: (t as { trailer_number: string }).trailer_number,
    vin: (t as { vin?: string | null }).vin ?? null,
    plate_number: (t as { plate_number?: string | null }).plate_number ?? null,
    assigned_driver_id: (t as { assigned_driver_id?: string | null }).assigned_driver_id ?? null,
    created_at: (t as { created_at?: string }).created_at,
  }));

  const driverList = (drivers ?? []).map((d) => ({
    id: (d as { id: string }).id,
    name: (d as { name?: string | null }).name ?? 'Unknown',
  }));

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <TrailersClient orgId={orgId} initialTrailers={trailerList} drivers={driverList} />
    </div>
  );
}
