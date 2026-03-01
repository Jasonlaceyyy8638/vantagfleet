import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getIntegrationsForOrg } from '@/app/actions/integrations';
import { IntegrationsHubClient } from './IntegrationsHubClient';

const ORG_COOKIE = 'vantag-current-org-id';

async function getCurrentOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null)));
  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  return stored && orgIds.includes(stored) ? stored : orgIds[0] ?? null;
}

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
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
