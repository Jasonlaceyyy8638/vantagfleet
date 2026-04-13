import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { getEnterpriseOverview } from '@/app/actions/enterprise-overview';
import { EnterpriseOverviewClient } from './EnterpriseOverviewClient';
import { getEnterpriseDemoOverview } from '@/src/constants/demoData';

export default async function EnterpriseOverviewPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    const data = getEnterpriseDemoOverview();
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-cloud-dancer">Enterprise overview</h1>
          <p className="text-cloud-dancer/70 mt-1">
            Fleet stats, driver rankings, and compliance at a glance.
          </p>
          <p className="text-xs text-cyber-amber/90 mt-2 border border-cyber-amber/25 rounded-lg px-3 py-2 bg-cyber-amber/5">Interactive sandbox — sample KPIs.</p>
        </div>
        <EnterpriseOverviewClient
          fleetStats={data.fleetStats}
          driverRanking={data.driverRanking}
          complianceHealth={data.complianceHealth}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? 'Driver';
  if (role === 'Dispatcher') redirect('/dashboard');

  const data = await getEnterpriseOverview();
  if ('error' in data) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <p className="text-red-400">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cloud-dancer">Enterprise overview</h1>
        <p className="text-cloud-dancer/70 mt-1">
          Fleet stats, driver rankings, and compliance at a glance.
        </p>
      </div>
      <EnterpriseOverviewClient
        fleetStats={data.fleetStats}
        driverRanking={data.driverRanking}
        complianceHealth={data.complianceHealth}
      />
    </div>
  );
}
