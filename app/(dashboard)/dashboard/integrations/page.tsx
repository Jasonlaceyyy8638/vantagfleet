import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getIntegrationsForOrg } from '@/app/actions/integrations';
import { IntegrationsHubClient } from './IntegrationsHubClient';
import { getDashboardOrgId } from '@/lib/admin';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-soft-cloud/70">No organization selected.</p>
      </div>
    );
  }

  const integrations = await getIntegrationsForOrg(orgId);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Integrations Hub</h1>
      <p className="text-soft-cloud/70 mb-6">
        Connect Samsara, Motive, and FMCSA to sync data. Run a compliance check to generate alerts for expired CDL/med or missing inspections.
      </p>
      <IntegrationsHubClient orgId={orgId} initialIntegrations={integrations} />
    </div>
  );
}
