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
      <p className="text-soft-cloud/70 mb-2">
        Connect your providers by signing in—no hunting for API keys. Click Connect, sign in with your provider, and authorize VantagFleet.
      </p>
      <p className="text-soft-cloud/50 text-sm mb-6">
        <strong>Motive:</strong> Click Connect to sign in with your Motive account and authorize. <strong>FMCSA:</strong> Click Connect to enable FMCSA access—no API key needed. You can also use your own API key if you prefer.
      </p>
      <IntegrationsHubClient orgId={orgId} initialIntegrations={integrations} />
    </div>
  );
}
