import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId, isSuperAdminImpersonating } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { hasFullAccess } from '@/lib/userHasAccess';
import { IFTADashboardClient } from './IFTADashboardClient';

export default async function IFTADashboardPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: org },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, ifta_enabled, is_beta_tester, beta_expires_at, role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single(),
    supabase.from('organizations').select('subscription_status, tier').eq('id', orgId).single(),
  ]);

  const profileData = profile as { id?: string; ifta_enabled?: boolean; is_beta_tester?: boolean; beta_expires_at?: string | null; role?: string } | null;
  const isDispatcher = profileData?.role === 'Dispatcher';
  const orgData = org as { subscription_status?: string | null; tier?: string | null } | null;
  const adminImpersonating = await isSuperAdminImpersonating(supabase, cookieStore);
  const hasAccess = adminImpersonating || hasFullAccess(profileData, orgData);
  const profileId = profileData?.id ?? null;
  const tier = (orgData?.tier ?? '').toString().trim().toLowerCase().replace(/\s+/g, '_');
  const isSoloPro = tier === 'solo_pro' || tier === 'solo';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;

  let initialReceipts: { id: string; receipt_date: string | null; state: string | null; gallons: number | null; status: string; file_url: string | null }[] = [];
  if (hasAccess && profileId) {
    const { data } = await supabase
      .from('ifta_receipts')
      .select('id, receipt_date, state, gallons, status, file_url')
      .eq('user_id', profileId)
      .eq('quarter', currentQuarter)
      .eq('year', year)
      .order('receipt_date', { ascending: false, nullsFirst: false });
    initialReceipts = (data ?? []).map((r) => ({
      id: r.id,
      receipt_date: r.receipt_date,
      state: r.state,
      gallons: r.gallons != null ? Number(r.gallons) : null,
      status: r.status ?? 'pending',
      file_url: r.file_url ?? null,
    }));
  }

  return (
    <IFTADashboardClient
      iftaEnabled={hasAccess}
      profileId={profileId}
      orgId={orgId}
      currentQuarter={currentQuarter}
      currentYear={year}
      initialReceipts={initialReceipts}
      isSoloPro={isSoloPro}
      isDispatcher={isDispatcher}
    />
  );
}
