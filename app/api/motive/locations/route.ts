import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { isAdmin, getDashboardOrgId, canImpersonateCarrier, IMPERSONATE_COOKIE } from '@/lib/admin';
import { getVehicleLocations, type FleetMapLocation } from '@/lib/motive';

async function fetchLocationsForOrg(orgId: string, orgName?: string): Promise<FleetMapLocation[]> {
  const result = await getVehicleLocations(orgId);
  if (Array.isArray(result)) {
    return result.map((loc) => ({
      ...loc,
      id: `${orgId}-${loc.id}`,
      ...(orgName ? { orgId, orgName } : {}),
    }));
  }
  return [];
}

/**
 * GET /api/motive/locations
 * Returns live GPS for the current org (or all Motive-connected orgs for admin).
 * Uses MOTIVE_API_KEY when set, otherwise OAuth token from Integrations.
 */
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
      .eq('provider', 'motive');
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
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return NextResponse.json({ locations: [] });
  }

  const impersonating = cookieStore.get(IMPERSONATE_COOKIE)?.value === orgId && (await canImpersonateCarrier(supabase));
  if (!impersonating) {
    const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
    const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
    if (!orgIds.includes(orgId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  const locations = await fetchLocationsForOrg(orgId);
  return NextResponse.json({ locations });
}

export type { FleetMapLocation };
