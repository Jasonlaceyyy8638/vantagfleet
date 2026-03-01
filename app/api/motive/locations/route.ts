import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { isAdmin } from '@/lib/admin';
import { getMotiveToken } from '@/lib/motive-sync-core';

const ORG_COOKIE = 'vantag-current-org-id';
const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';

export type FleetMapLocation = {
  id: string;
  lat: number;
  lng: number;
  vehicleName: string;
  driverName: string;
  speed: number | null;
  status: 'Moving' | 'Stationary';
  orgId?: string;
  orgName?: string;
};

/** Normalize Motive vehicle_locations response into FleetMapLocation[]. */
function normalizeMotiveLocations(
  data: unknown,
  orgId: string,
  orgName?: string
): FleetMapLocation[] {
  const out: FleetMapLocation[] = [];
  let list: Array<Record<string, unknown>> = [];

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.vehicle_locations)) list = d.vehicle_locations as Array<Record<string, unknown>>;
    else if (Array.isArray(d.vehicles)) list = d.vehicles as Array<Record<string, unknown>>;
    else if (Array.isArray(d.data)) list = d.data as Array<Record<string, unknown>>;
  }

  for (const v of list) {
    const lat = typeof v.latitude === 'number' ? v.latitude : typeof (v as { lat?: number }).lat === 'number' ? (v as { lat: number }).lat : null;
    const lng = typeof v.longitude === 'number' ? v.longitude : typeof (v as { lon?: number }).lon === 'number' ? (v as { lon: number }).lon : null;
    if (lat == null || lng == null) continue;

    const id = String((v as { id?: number }).id ?? (v as { vehicle_id?: string }).vehicle_id ?? `${lat}-${lng}`);
    const vehicleName = String((v as { number?: string }).number ?? (v as { vehicle_name?: string }).vehicle_name ?? (v as { name?: string }).name ?? 'Vehicle');
    const rawSpeed = (v as { speed?: number }).speed;
    const speed = typeof rawSpeed === 'number' ? rawSpeed : null;
    const rawMoving = (v as { moving?: boolean }).moving;
    const moving =
      typeof rawMoving === 'boolean'
        ? rawMoving
        : (v as { status?: string }).status === 'moving' || (speed != null && speed > 0);
    const status: 'Moving' | 'Stationary' = moving ? 'Moving' : 'Stationary';

    let driverName = '—';
    const driver = (v as { current_driver?: Record<string, unknown> }).current_driver ?? (v as { driver?: Record<string, unknown> }).driver;
    if (driver && typeof driver === 'object') {
      const first = (driver as { first_name?: string }).first_name ?? '';
      const last = (driver as { last_name?: string }).last_name ?? '';
      driverName = [first, last].filter(Boolean).join(' ') || (driver as { name?: string }).name as string || '—';
    }

    out.push({
      id: `${orgId}-${id}`,
      lat,
      lng,
      vehicleName,
      driverName,
      speed,
      status,
      ...(orgName ? { orgId, orgName } : {}),
    });
  }
  return out;
}

async function fetchLocationsForOrg(orgId: string, orgName?: string): Promise<FleetMapLocation[]> {
  const token = await getMotiveToken(orgId);
  if (!token) return [];

  const res = await fetch(`${MOTIVE_API_BASE}/vehicle_locations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return normalizeMotiveLocations(data, orgId, orgName);
}

/**
 * GET /api/motive/locations
 * Returns vehicle locations for the current user's org (carrier) or all Motive-connected orgs (admin).
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
  const orgId = cookieStore.get(ORG_COOKIE)?.value;
  if (!orgId) {
    return NextResponse.json({ locations: [] });
  }

  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  if (!orgIds.includes(orgId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const locations = await fetchLocationsForOrg(orgId);
  return NextResponse.json({ locations });
}
