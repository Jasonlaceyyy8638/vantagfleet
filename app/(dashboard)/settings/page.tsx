import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { CopyUserId } from './CopyUserId';
import { getDashboardOrgId } from '@/lib/admin';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  let stripeCustomerId: string | null = null;
  if (orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', orgId)
      .single();
    stripeCustomerId = org?.stripe_customer_id ?? null;
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Settings</h1>
      <p className="text-soft-cloud/70 mb-8">
        Organization and billing. Manage your subscription, payment method, or cancel anytime.
      </p>

      {user && (
        <div className="rounded-xl border border-white/10 bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-soft-cloud mb-2">Your account</h2>
          <p className="text-sm text-soft-cloud/70 mb-2">
            Your user ID (use this in Supabase scripts to add yourself as admin, etc.):
          </p>
          <CopyUserId userId={user.id} />
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-2">Billing & subscription</h2>
        <p className="text-sm text-soft-cloud/70 mb-4">
          Update your card, view invoices, or cancel your plan. You’ll be redirected to our secure billing portal.
        </p>
        <ManageSubscriptionButton stripeCustomerId={stripeCustomerId} />
      </div>
    </div>
  );
}
