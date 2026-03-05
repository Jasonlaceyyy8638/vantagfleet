import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { CopyUserId } from './CopyUserId';
import { CarrierProfile } from './CarrierProfile';
import { getDashboardOrgId } from '@/lib/admin';
import { EMAIL_BILLING } from '@/lib/email-addresses';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (orgId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single();
    const role = (profile as { role?: string } | null)?.role;
    if (role === 'Dispatcher') redirect('/dashboard');
  }

  let stripeCustomerId: string | null = null;
  let orgName = '';
  let usdotNumber: string | null = null;
  let authorityVerified = false;
  let legalName: string | null = null;
  let address: string | null = null;
  let safetyRating: string | null = null;
  let dispatchPhone: string | null = null;
  if (orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, usdot_number, stripe_customer_id, authority_verified, legal_name, address, safety_rating, dispatch_phone')
      .eq('id', orgId)
      .single();
    stripeCustomerId = org?.stripe_customer_id ?? null;
    orgName = org?.name ?? '';
    usdotNumber = org?.usdot_number ?? null;
    authorityVerified = !!org?.authority_verified;
    legalName = (org as { legal_name?: string | null })?.legal_name ?? null;
    address = (org as { address?: string | null })?.address ?? null;
    safetyRating = (org as { safety_rating?: string | null })?.safety_rating ?? null;
    dispatchPhone = (org as { dispatch_phone?: string | null })?.dispatch_phone ?? null;
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Settings</h1>
      <p className="text-soft-cloud/70 mb-8">
        Organization and billing. Manage your subscription, payment method, or cancel anytime.
      </p>

      {orgId && (
        <CarrierProfile
          orgId={orgId}
          orgName={orgName}
          usdotNumber={usdotNumber}
          authorityVerified={authorityVerified}
          legalName={legalName}
          address={address}
          safetyRating={safetyRating}
          dispatchPhone={dispatchPhone}
        />
      )}

      {user && (
        <div className="rounded-xl border border-white/10 bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-soft-cloud mb-2">Your account</h2>
          <p className="text-sm text-soft-cloud/70 mb-2">
            Your user ID (use this in Supabase scripts to add yourself as admin, etc.):
          </p>
          <CopyUserId userId={user.id} />
          <p className="text-sm text-soft-cloud/70 mt-4 pt-4 border-t border-white/10">
            <Link href="/account/change-password" className="text-cyber-amber hover:underline">
              Change password
            </Link>
          </p>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-2">Billing & subscription</h2>
        <p className="text-sm text-soft-cloud/70 mb-4">
          Update your card, view invoices, or cancel your plan. You’ll be redirected to our secure billing portal.
        </p>
        <ManageSubscriptionButton stripeCustomerId={stripeCustomerId} />
        <p className="text-xs text-soft-cloud/50 mt-4 pt-4 border-t border-white/10">
          Receipts or plan questions? Email{' '}
          <a href={`mailto:${EMAIL_BILLING}`} className="text-cyber-amber hover:underline">{EMAIL_BILLING}</a>.
        </p>
      </div>
    </div>
  );
}
