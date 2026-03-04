import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { hasFullAccess } from '@/lib/userHasAccess';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';

export default async function BetaEndedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const [
    { data: profile },
    { data: org },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_beta_tester, beta_expires_at, subscription_status')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single(),
    supabase.from('organizations').select('subscription_status').eq('id', orgId).single(),
  ]);

  const profileData = profile as { is_beta_tester?: boolean; beta_expires_at?: string | null; subscription_status?: string | null } | null;
  const orgData = org as { subscription_status?: string | null } | null;
  if (hasFullAccess(profileData, orgData)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-midnight-ink flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-card p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-soft-cloud mb-2">Your Beta Access Has Ended</h1>
        <p className="text-soft-cloud/70 mb-6">
          Thanks for being an early tester. To keep your fleet and IFTA data active, subscribe at our early-adopter rate.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
        >
          Subscribe now
        </Link>
        <p className="mt-6 text-sm text-soft-cloud/50">
          <Link href="/dashboard" className="text-cyber-amber/80 hover:underline">Return to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
