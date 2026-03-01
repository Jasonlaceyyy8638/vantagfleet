'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';

type MotiveCredential = { access_token: string; refresh_token?: string | null; expires_at?: number };

/** Get access token for an org's Motive integration. Returns null if not connected or invalid. */
async function getMotiveToken(orgId: string): Promise<string | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }
  const { data: row } = await admin
    .from('carrier_integrations')
    .select('credential')
    .eq('org_id', orgId)
    .eq('provider', 'motive')
    .maybeSingle();
  if (!row?.credential) return null;
  try {
    const cred = JSON.parse(row.credential) as MotiveCredential;
    return cred.access_token || null;
  } catch {
    return null;
  }
}

/** Sync Motive fleet data for an org: fetch /v1/vehicles and /v1/users, upsert into vehicles and drivers. */
export async function syncMotiveFleet(
  orgId: string
): Promise<{ ok: true; vehicles: number; drivers: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  if (!orgIds.includes(orgId)) return { error: 'You do not have access to this organization.' };

  const token = await getMotiveToken(orgId);
  if (!token) return { error: 'Motive not connected for this organization. Connect in Integrations first.' };

  const headers = { Authorization: `Bearer ${token}` };

  let vehiclesRes: Response;
  let usersRes: Response;
  try {
    [vehiclesRes, usersRes] = await Promise.all([
      fetch(`${MOTIVE_API_BASE}/vehicles`, { headers, cache: 'no-store' }),
      fetch(`${MOTIVE_API_BASE}/users`, { headers, cache: 'no-store' }),
    ]);
  } catch (e) {
    return { error: 'Failed to reach Motive API.' };
  }

  const vehiclesJson = vehiclesRes.ok ? await vehiclesRes.json().catch(() => ({})) : {};
  const usersJson = usersRes.ok ? await usersRes.json().catch(() => ({})) : {};

  const vehiclesList: { id: number; number?: string; vin?: string; license_plate_state?: string }[] =
    Array.isArray(vehiclesJson.vehicles) ? vehiclesJson.vehicles : Array.isArray(vehiclesJson) ? vehiclesJson : [];
  const usersList: { id: number; first_name?: string; last_name?: string; user_name?: string; email?: string }[] =
    Array.isArray(usersJson.users) ? usersJson.users : Array.isArray(usersJson) ? usersJson : [];

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Service unavailable.' };
  }

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

  return { ok: true, vehicles: vehiclesUpserted, drivers: driversUpserted };
}
