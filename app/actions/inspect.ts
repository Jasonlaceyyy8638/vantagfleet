'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMotiveHosLogs } from '@/lib/motive';
import type { HosLogDay } from '@/lib/motive';

const INSPECT_TOKEN_MAX_AGE_MS = 4 * 60 * 60 * 1000;

export type InspectSession = {
  ok: true;
  orgId: string;
  orgName: string;
  usdot: string | null;
  driverId: string | null;
  driverName: string | null;
  vehicleId: string | null;
  vin: string | null;
  plate: string | null;
  vehicleName: string | null;
  hosLogs: HosLogDay[];
  eldProvider: 'motive' | 'geotab' | null;
};

export type InspectResult = InspectSession | { ok: false; reason: 'invalid_token' | 'expired_session' | 'expired_token' | 'no_org' };

export async function getInspectSession(token: string): Promise<InspectResult> {
  const supabase = await createClient();
  const { data: rows } = await supabase.rpc('get_inspect_token', { p_token: token });
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row?.org_id) return { ok: false, reason: 'invalid_token' };

  const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const now = Date.now();
  if (expiresAt > 0 && now > expiresAt) return { ok: false, reason: 'expired_token' };
  if (now - createdAt > INSPECT_TOKEN_MAX_AGE_MS) return { ok: false, reason: 'expired_session' };

  const orgId = row.org_id as string;
  const driverId = (row.driver_id as string) || null;

  const admin = createAdminClient();
  const { data: org } = await admin.from('organizations').select('name, usdot_number').eq('id', orgId).single();
  if (!org) return { ok: false, reason: 'no_org' };

  let driverName: string | null = null;
  let vehicleId: string | null = null;
  let vin: string | null = null;
  let plate: string | null = null;
  let vehicleName: string | null = null;

  if (driverId) {
    const { data: driver } = await admin.from('drivers').select('name, assigned_vehicle_id').eq('id', driverId).single();
    if (driver) {
      driverName = (driver as { name?: string }).name ?? null;
      const avId = (driver as { assigned_vehicle_id?: string }).assigned_vehicle_id;
      if (avId) {
        vehicleId = avId;
        const { data: vehicle } = await admin.from('vehicles').select('vin, plate, unit_number').eq('id', avId).single();
        if (vehicle) {
          const v = vehicle as { vin?: string; plate?: string; unit_number?: string };
          vin = v.vin ?? null;
          plate = v.plate ?? null;
          vehicleName = v.unit_number ?? v.vin ?? null;
        }
      }
    }
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 8);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  let hosLogs: HosLogDay[] = [];
  let eldProvider: 'motive' | 'geotab' | null = null;

  const { data: motiveInt } = await admin
    .from('carrier_integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', 'motive')
    .maybeSingle();
  if (motiveInt) {
    eldProvider = 'motive';
    const resolved = await getMotiveHosLogs(orgId, startDate, endDate);
    if (!('error' in resolved)) hosLogs = resolved.logs;
  }

  if (hosLogs.length === 0) {
    const { data: geotabInt } = await admin
      .from('carrier_integrations')
      .select('id')
      .eq('org_id', orgId)
      .eq('provider', 'geotab')
      .maybeSingle();
    if (geotabInt) eldProvider = 'geotab';
  }

  return {
    ok: true,
    orgId,
    orgName: (org as { name?: string }).name ?? 'Carrier',
    usdot: (org as { usdot_number?: string }).usdot_number ?? null,
    driverId,
    driverName,
    vehicleId,
    vin,
    plate,
    vehicleName,
    hosLogs,
    eldProvider,
  };
}
