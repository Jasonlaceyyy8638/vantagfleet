import { createClient } from '@/lib/supabase/server';
import { isAdmin, getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrgSetupClient } from './OrgSetupClient';
import { ManualOrgCreation } from './ManualOrgCreation';

export default async function AdminSetupPage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  const role = await getPlatformRole(supabase);
  if (!admin && !isPlatformStaff(role)) redirect('/dashboard');

  const adminClient = createAdminClient();
  const { data: orgs } = await adminClient
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <OrgSetupClient initialOrgs={(orgs ?? []) as { id: string; name: string; usdot_number: string | null; status: string; stripe_customer_id: string | null; created_at: string }[]} />
          <ManualOrgCreation />
        </div>
      </div>
    </div>
  );
}
