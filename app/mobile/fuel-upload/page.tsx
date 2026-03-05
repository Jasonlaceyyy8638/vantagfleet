import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { MobileFuelUploadClient } from './MobileFuelUploadClient';

export default async function MobileFuelUploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent('/mobile/fuel-upload')}`);

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const profileId = (profile as { id?: string } | null)?.id ?? null;
  if (!profileId) redirect('/dashboard');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, unit_number, vin')
    .eq('org_id', orgId)
    .order('vin');

  const vehicleList = (vehicles ?? []).map((v) => ({
    id: (v as { id: string }).id,
    unit_number: (v as { unit_number?: string | null }).unit_number ?? null,
    vin: (v as { vin?: string | null }).vin ?? null,
  }));

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud p-4 pb-8 safe-area-inset">
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-cyber-amber tracking-wide">VantagFleet</h1>
        <p className="text-soft-cloud/70 text-sm mt-1">Driver Tools</p>
      </header>
      <MobileFuelUploadClient
        profileId={profileId}
        orgId={orgId}
        quarter={quarter}
        year={year}
        vehicles={vehicleList}
      />
    </div>
  );
}
