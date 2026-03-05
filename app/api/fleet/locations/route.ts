/**
 * GET /api/fleet/locations
 * Returns live GPS for the current organization (Motive or Geotab).
 * Dispatchers and other org members see every truck that shares their organization_id.
 * Query: ?org_id=uuid (optional) — if provided and user has access, use it; else use dashboard org from cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { isAdmin, getDashboardOrgId, isSuperAdmin, IMPERSONATE_COOKIE } from '@/lib/admin';
import { getVehicleLocations, type FleetMapLocation } from '@/lib/motive';
import { getDeviceLocations } from '@/lib/geotab';
async function getGeotabCredential(orgId: string): Promise<{ server: string; database: string; userName: string; sessionId: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('carrier_integrations')
    .select('credential')
    .eq('org_id', orgId)
    .eq('provider', 'geotab')
    .maybeSingle();
  if (!data?.credential) return null;
  try {
    const c = JSON.parse(data.credential as string) as { sessionId?: string };
    return c?.sessionId ? (c as { server: string; database: string; userName: string; sessionId: string }) : null;
  } catch {
    return null;
  }
}

async function fetchLocationsForOrg(orgId: string, orgName?: string): Promise<FleetMapLocation[]> {
  const out: FleetMapLocation[] = [];
  const motiveResult = await getVehicleLocations(orgId);
  if (Array.isArray(motiveResult)) {
    motiveResult.forEach((loc) => {
      out.push({
        ...loc,
        id: `motive-${loc.id}`,
        ...(orgName ? { orgId, orgName } : {}),
      });
    });
  }
  const geotabCred = await getGeotabCredential(orgId);
  if (geotabCred) {
    const geo = await getDeviceLocations(geotabCred);
    if (!('error' in geo)) {
      const admin = createAdminClient();
      const { data: vehicles } = await admin
        .from('vehicles')
        .select('geotab_id, unit_number')
        .eq('org_id', orgId)
        .eq('provider', 'geotab');
      const nameByGeotabId = new Map((vehicles ?? []).map((v) => [v.geotab_id, v.unit_number ?? '']));
      geo.locations.forEach((loc) => {
        const devId = loc.id.replace(/^geotab-/, '');
        const vehicleName = nameByGeotabId.get(devId) || loc.vehicleName;
        out.push({
          id: loc.id,
          lat: loc.lat,
          lng: loc.lng,
          vehicleName,
          driverName: loc.driverName,
          speed: loc.speed,
          status: loc.status,
          ...(orgName ? { orgId, orgName } : {}),
        });
      });
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const adminUser = await isAdmin(supabase);
  const admin = createAdminClient();

  if (adminUser) {
    const { data: rows } = await admin
      .from('carrier_integrations')
      .select('org_id')
      .in('provider', ['motive', 'geotab']);
    const orgIds = Array.from(new Set((rows ?? []).map((r) => r.org_id)));
    if (orgIds.length === 0) {
      return NextResponse.json({ locations: [] });
    }
    const { data: orgs } = await admin.from('organizations').select('id, name').in('id', orgIds);
    const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name ?? '—']));
    const all: FleetMapLocation[] = [];
    for (const orgId of orgIds) {
      const locs = await fetchLocationsForOrg(orgId, orgMap.get(orgId));
      all.push(...locs);
    }
    return NextResponse.json({ locations: all });
  }

  const cookieStore = await cookies();
  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const userOrgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null)));
  const isSuperAdminViewingOrg = await isSuperAdmin(supabase);
  const impersonatedOrg = cookieStore.get(IMPERSONATE_COOKIE)?.value;

  let orgId: string | null = null;
  const queryOrgId = request.nextUrl.searchParams.get('org_id');
  if (queryOrgId && (userOrgIds.includes(queryOrgId) || (isSuperAdminViewingOrg && impersonatedOrg === queryOrgId))) {
    orgId = queryOrgId;
  }
  if (!orgId) {
    orgId = await getDashboardOrgId(supabase, cookieStore);
  }
  if (!orgId) {
    return NextResponse.json({ locations: [] });
  }
  if (!userOrgIds.includes(orgId) && !(isSuperAdminViewingOrg && impersonatedOrg === orgId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const locations = await fetchLocationsForOrg(orgId);
  return NextResponse.json({ locations });
}

export type { FleetMapLocation };
