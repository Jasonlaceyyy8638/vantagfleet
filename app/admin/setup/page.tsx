import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrgSetupClient } from './OrgSetupClient';

export default async function AdminSetupPage() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) redirect('/dashboard');

  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from('organizations')
    .select('id, name, usdot_number, status, stripe_customer_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-soft-cloud">Organization Setup</h1>
        <p className="text-soft-cloud/70 mt-1">
          Add new customers (creates organization + Stripe customer). Use Customer Support to invite drivers or fix account issues.
        </p>
      </div>
      <OrgSetupClient initialOrgs={(orgs ?? []) as { id: string; name: string; usdot_number: string | null; status: string; stripe_customer_id: string | null; created_at: string }[]} />
    </div>
  );
}
