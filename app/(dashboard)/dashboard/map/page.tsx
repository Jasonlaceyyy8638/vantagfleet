import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId, isSuperAdminImpersonating } from '@/lib/admin';
import { canSeeMap } from '@/lib/userHasAccess';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import { MapUpgradeOverlay } from './MapUpgradeOverlay';

export default async function DashboardMapPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-8">
        <p className="text-cloud-dancer/70">No organization selected.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const [
    { data: profileRow },
    { data: orgRow },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_beta_tester')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single(),
    supabase
      .from('organizations')
      .select('tier')
      .eq('id', orgId)
      .single(),
  ]);

  const profile = profileRow as { is_beta_tester?: boolean } | null;
  const org = orgRow as { tier?: string | null } | null;
  const adminImpersonating = await isSuperAdminImpersonating(supabase, cookieStore);
  const mapAccess = adminImpersonating || canSeeMap(profile, org);

  if (mapAccess) {
    return (
      <div
        className="w-full flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{ height: 'calc(100vh - 64px)', minHeight: 400 }}
      >
        <FleetMapDynamic
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''}
          organizationId={orgId}
          height="100%"
          className="rounded-xl h-full"
        />
      </div>
    );
  }

  return <MapUpgradeOverlay />;
}
