/**
 * Universal ELD fleet data: fetch vehicles (and optionally locations/trips) from Motive or Geotab.
 * All data is normalized so the rest of the app can treat both providers identically.
 */

import { getMotiveToken } from '@/lib/motive-sync-core';
import { getDevices, type GeotabCredentials } from '@/lib/geotab';
import { createAdminClient } from '@/lib/supabase/admin';

export type EldProvider = 'motive' | 'geotab';

/** Normalized vehicle from any ELD; sync into vehicles table with provider set. */
export type UniversalVehicle = {
  eld_id: string;
  vin: string | null;
  unit_number: string | null;
  plate: string | null;
  name?: string | null;
};

export type FetchFleetDataResult =
  | { ok: true; vehicles: UniversalVehicle[] }
  | { ok: false; error: string };

async function getGeotabCredential(orgId: string): Promise<GeotabCredentials | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('carrier_integrations')
    .select('credential')
    .eq('org_id', orgId)
    .eq('provider', 'geotab')
    .maybeSingle();
  if (!data?.credential) return null;
  try {
    const c = JSON.parse(data.credential as string) as GeotabCredentials;
    return c?.sessionId ? c : null;
  } catch {
    return null;
  }
}

/**
 * Fetch fleet vehicles from the given ELD provider.
 * - motive: uses Motive API (OAuth token or MOTIVE_API_KEY).
 * - geotab: uses stored session and Get&lt;Device&gt; via lib/geotab.
 */
export async function fetchFleetData(
  provider: EldProvider,
  orgId: string
): Promise<FetchFleetDataResult> {
  if (provider === 'motive') {
    const token = await getMotiveToken(orgId);
    if (!token) return { ok: false, error: 'Motive not connected for this organization.' };
    const res = await fetch('https://api.gomotive.com/v1/vehicles', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: res.status === 401 ? 'Motive auth failed. Reconnect in Integrations.' : `Motive API ${res.status}: ${text.slice(0, 150)}`,
      };
    }
    const json = await res.json().catch(() => ({}));
    const list: { id: number; number?: string; vin?: string; license_plate_state?: string }[] =
      Array.isArray(json.vehicles) ? json.vehicles : Array.isArray(json) ? json : [];
    const vehicles: UniversalVehicle[] = list.map((v) => ({
      eld_id: String(v.id),
      vin: v.vin ?? null,
      unit_number: v.number ?? null,
      plate: v.license_plate_state ?? null,
      name: v.number ?? null,
    }));
    return { ok: true, vehicles };
  }

  if (provider === 'geotab') {
    const cred = await getGeotabCredential(orgId);
    if (!cred) return { ok: false, error: 'Geotab is not connected for this organization.' };
    const result = await getDevices(cred);
    if ('error' in result) return { ok: false, error: result.error };
    const vehicles: UniversalVehicle[] = result.devices.map((d) => ({
      eld_id: d.id,
      vin: (d.vin ?? '').trim() || null,
      unit_number: d.name ?? d.serialNumber ?? null,
      plate: d.licensePlate ?? null,
      name: d.name ?? null,
    }));
    return { ok: true, vehicles };
  }

  return { ok: false, error: `Unknown provider: ${provider}` };
}
