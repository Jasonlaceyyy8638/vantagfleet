import { createAdminClient } from '@/lib/supabase/admin';

const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type MotiveCredential = { access_token: string; refresh_token?: string | null; expires_at?: number };

export async function getMotiveToken(orgId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('carrier_integrations')
      .select('credential')
      .eq('org_id', orgId)
      .eq('provider', 'motive')
      .maybeSingle();
    if (!row?.credential) return null;
    const cred = JSON.parse(row.credential) as MotiveCredential;
    return cred.access_token || null;
  } catch {
    return null;
  }
}

/** Fetch Motive API and upsert vehicles + drivers. Uses 5-minute cache per org so repeated clicks only hit Motive once. */
export async function runMotiveSyncCore(
  orgId: string
): Promise<{ ok: true; vehicles: number; drivers: number } | { error: string }> {
  const admin = createAdminClient();

  try {
    const { data: row } = await admin
      .from('carrier_integrations')
      .select('last_synced_at, last_sync_vehicles_count, last_sync_drivers_count')
      .eq('org_id', orgId)
      .eq('provider', 'motive')
      .maybeSingle();

    if (row?.last_synced_at) {
      const lastSync = new Date(row.last_synced_at).getTime();
      if (Date.now() - lastSync < CACHE_TTL_MS) {
        return {
          ok: true,
          vehicles: (row as { last_sync_vehicles_count?: number }).last_sync_vehicles_count ?? 0,
          drivers: (row as { last_sync_drivers_count?: number }).last_sync_drivers_count ?? 0,
        };
      }
    }
  } catch {
    // Cache columns may not exist yet; proceed with real sync
  }

  const token = await getMotiveToken(orgId);
  if (!token) return { error: 'Motive not connected for this organization.' };

  const headers = { Authorization: `Bearer ${token}` };
  let vehiclesRes: Response;
  let usersRes: Response;
  try {
    [vehiclesRes, usersRes] = await Promise.all([
      fetch(`${MOTIVE_API_BASE}/vehicles`, { headers, cache: 'no-store' }),
      fetch(`${MOTIVE_API_BASE}/users`, { headers, cache: 'no-store' }),
    ]);
  } catch {
    return { error: 'Failed to reach Motive API.' };
  }

  const vehiclesJson = vehiclesRes.ok ? await vehiclesRes.json().catch(() => ({})) : {};
  const usersJson = usersRes.ok ? await usersRes.json().catch(() => ({})) : {};
  const vehiclesList: { id: number; number?: string; vin?: string; license_plate_state?: string }[] =
    Array.isArray(vehiclesJson.vehicles) ? vehiclesJson.vehicles : Array.isArray(vehiclesJson) ? vehiclesJson : [];
  const usersList: { id: number; first_name?: string; last_name?: string; user_name?: string; email?: string }[] =
    Array.isArray(usersJson.users) ? usersJson.users : Array.isArray(usersJson) ? usersJson : [];

  const admin = createAdminClient();
  let vehiclesUpserted = 0;
  for (const v of vehiclesList) {
    const motiveId = String(v.id);
    const unitNumber = v.number ?? null;
    const vin = v.vin ?? null;
    const plate = v.license_plate_state ?? null;
    const { data: existing } = await admin
      .from('vehicles')
      .select('id')
      .eq('org_id', orgId)
      .eq('motive_id', motiveId)
      .maybeSingle();
    if (existing) {
      const { error } = await admin
        .from('vehicles')
        .update({ unit_number: unitNumber, vin, plate, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (!error) vehiclesUpserted++;
    } else {
      const { error } = await admin.from('vehicles').insert({
        org_id: orgId,
        motive_id: motiveId,
        unit_number: unitNumber,
        vin,
        plate,
      });
      if (!error) vehiclesUpserted++;
    }
  }

  let driversUpserted = 0;
  for (const u of usersList) {
    const motiveId = String(u.id);
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(' ') ||
      u.user_name ||
      u.email ||
      'Unknown';
    const { data: existing } = await admin
      .from('drivers')
      .select('id')
      .eq('org_id', orgId)
      .eq('motive_id', motiveId)
      .maybeSingle();
    if (existing) {
      const { error } = await admin
        .from('drivers')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (!error) driversUpserted++;
    } else {
      const { error } = await admin.from('drivers').insert({
        org_id: orgId,
        motive_id: motiveId,
        name,
      });
      if (!error) driversUpserted++;
    }
  }

  const now = new Date().toISOString();
  try {
    await admin
      .from('carrier_integrations')
      .update({
        last_synced_at: now,
        last_sync_vehicles_count: vehiclesUpserted,
        last_sync_drivers_count: driversUpserted,
        updated_at: now,
      })
      .eq('org_id', orgId)
      .eq('provider', 'motive');
  } catch {
    // Count columns may not exist yet (migration 019)
  }

  return { ok: true, vehicles: vehiclesUpserted, drivers: driversUpserted };
}
