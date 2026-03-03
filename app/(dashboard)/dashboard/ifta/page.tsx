import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { IFTADashboardClient } from './IFTADashboardClient';

export default async function IFTADashboardPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, ifta_enabled')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const iftaEnabled = (profile as { ifta_enabled?: boolean } | null)?.ifta_enabled ?? false;
  const profileId = (profile as { id?: string } | null)?.id ?? null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;

  let initialReceipts: { id: string; receipt_date: string | null; state: string | null; gallons: number | null; status: string }[] = [];
  if (iftaEnabled && profileId) {
    const { data } = await supabase
      .from('ifta_receipts')
      .select('id, receipt_date, state, gallons, status')
      .eq('user_id', profileId)
      .eq('quarter', currentQuarter)
      .eq('year', year)
      .order('receipt_date', { ascending: false });
    initialReceipts = (data ?? []).map((r) => ({
      id: r.id,
      receipt_date: r.receipt_date,
      state: r.state,
      gallons: r.gallons != null ? Number(r.gallons) : null,
      status: r.status ?? 'pending',
    }));
  }

  return (
    <IFTADashboardClient
      iftaEnabled={iftaEnabled}
      profileId={profileId}
      currentQuarter={currentQuarter}
      currentYear={year}
      initialReceipts={initialReceipts}
    />
  );
}
