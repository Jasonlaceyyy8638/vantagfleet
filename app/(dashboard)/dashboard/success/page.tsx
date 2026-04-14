import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { WelcomeSuccessScreen } from './WelcomeSuccessScreen';

export default async function DashboardSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_beta_tester')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const isBeta = (profile as { is_beta_tester?: boolean } | null)?.is_beta_tester === true;
  if (isBeta) {
    await supabase
      .from('profiles')
      .update({ founder_status: true })
      .eq('user_id', user.id)
      .eq('org_id', orgId);
  }

  const name = (profile as { full_name?: string | null } | null)?.full_name ?? null;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <WelcomeSuccessScreen name={name} />
    </div>
  );
}
