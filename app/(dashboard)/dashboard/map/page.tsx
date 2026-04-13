import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId, isSuperAdminImpersonating } from '@/lib/admin';
import { canSeeMap } from '@/lib/userHasAccess';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import { MapUpgradeOverlay } from './MapUpgradeOverlay';
import { getDemoFleetMapLocations, getDemoFleetStopOverlays } from '@/src/constants/demoData';

export default async function DashboardMapPage() {
  const cookieStore = await cookies();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';

  if (cookieStore.get('vf_demo')?.value === '1') {
    if (!mapboxToken) {
      return (
        <div
          className="w-full flex-1 min-h-0 rounded-xl border border-white/10 bg-card flex flex-col items-center justify-center p-8"
          style={{ height: 'calc(100vh - 64px)', minHeight: 400 }}
        >
          <p className="text-soft-cloud/80 text-center max-w-md">
            Live Map is not configured. Add a Mapbox access token in your deployment environment as{' '}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyber-amber">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to show the map.
          </p>
        </div>
      );
    }
    return (
      <div
        className="w-full flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{ height: 'calc(100vh - 64px)', minHeight: 400 }}
      >
        <FleetMapDynamic
          sandboxMode
          accessToken={mapboxToken}
          initialLocations={getDemoFleetMapLocations()}
          stopOverlays={getDemoFleetStopOverlays()}
          height="100%"
          className="rounded-xl h-full"
        />
      </div>
    );
  }

  const supabase = await createClient();
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

  if (!mapAccess) {
    return <MapUpgradeOverlay />;
  }

  if (!mapboxToken) {
    return (
      <div
        className="w-full flex-1 min-h-0 rounded-xl border border-white/10 bg-card flex flex-col items-center justify-center p-8"
        style={{ height: 'calc(100vh - 64px)', minHeight: 400 }}
      >
        <p className="text-soft-cloud/80 text-center max-w-md">
          Live Map is not configured. Add a Mapbox access token in your deployment environment as <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyber-amber">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to show the map.
        </p>
        <p className="text-sm text-soft-cloud/60 mt-3">
          Get a free token at{' '}
          <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-cyber-amber hover:underline">
            mapbox.com
          </a>.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full flex-1 min-h-0 rounded-xl overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', minHeight: 400 }}
    >
      <FleetMapDynamic
        accessToken={mapboxToken}
        organizationId={orgId}
        height="100%"
        className="rounded-xl h-full"
      />
    </div>
  );
}
