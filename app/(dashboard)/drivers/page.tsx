import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ComplianceStatusBadge } from '@/components/ComplianceStatusBadge';
import { DriverListClient } from './DriverListClient';

const ORG_COOKIE = 'vantag-current-org-id';

async function getCurrentOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = [...new Set((profiles ?? []).map((p) => p.org_id))];
  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  return stored && orgIds.includes(stored) ? stored : orgIds[0] ?? null;
}

export default async function DriversPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-slate-400">No organization selected.</p>
      </div>
    );
  }

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name, license_number, license_state, med_card_expiry, clearinghouse_status')
    .eq('org_id', orgId)
    .order('name');

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-2">Drivers</h1>
      <p className="text-slate-400 mb-6">Manage drivers and view med card compliance status.</p>
      <DriverListClient orgId={orgId} initialDrivers={drivers ?? []} />
    </div>
  );
}
