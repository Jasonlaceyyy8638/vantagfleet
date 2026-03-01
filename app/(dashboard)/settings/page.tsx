import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';

const ORG_COOKIE = 'vantag-current-org-id';

async function getCurrentOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id)));
  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  return stored && orgIds.includes(stored) ? stored : orgIds[0] ?? null;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

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
