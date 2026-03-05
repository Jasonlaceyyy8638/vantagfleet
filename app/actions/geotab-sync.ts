'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { fetchFleetData } from '@/lib/fetchFleetData';

/** Ensure current user is in org. */
async function ensureUserInOrg(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  return orgIds.includes(orgId);
}

/**
 * Sync Geotab devices to universal vehicles table with provider='geotab'.
 * Uses fetchFleetData('geotab') then upserts by geotab_id or vin.
 */
export async function syncGeotabVehicles(
  orgId: string
): Promise<{ ok: true; vehicles: number } | { error: string }> {
  const allowed = await ensureUserInOrg(orgId);
  if (!allowed) return { error: 'You do not have access to this organization.' };

  const result = await fetchFleetData('geotab', orgId);
  if (!result.ok) return { error: result.error };

  const admin = createAdminClient();
  let vehiclesUpserted = 0;

  for (const v of result.vehicles) {
    const eldId = v.eld_id;
    const vin = v.vin?.trim() || null;
    const unitNumber = v.unit_number ?? null;
    const plate = v.plate ?? null;

    const { data: existingByGeotab } = await admin
      .from('vehicles')
      .select('id')
      .eq('org_id', orgId)
      .eq('geotab_id', eldId)
      .maybeSingle();

    if (existingByGeotab) {
      const { error } = await admin
        .from('vehicles')
        .update({
          unit_number: unitNumber,
          plate,
          vin: vin ?? undefined,
          provider: 'geotab',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByGeotab.id);
      if (!error) vehiclesUpserted++;
      continue;
    }

    if (vin) {
      const { data: existingByVin } = await admin
        .from('vehicles')
        .select('id')
        .eq('org_id', orgId)
        .eq('vin', vin)
        .maybeSingle();
      if (existingByVin) {
        const { error } = await admin
          .from('vehicles')
          .update({
            geotab_id: eldId,
            unit_number: unitNumber,
            plate,
            provider: 'geotab',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingByVin.id);
        if (!error) vehiclesUpserted++;
        continue;
      }
    }

    const { error } = await admin.from('vehicles').insert({
      org_id: orgId,
      geotab_id: eldId,
      provider: 'geotab',
      vin,
      unit_number: unitNumber,
      plate,
    });
    if (!error) vehiclesUpserted++;
  }

  const now = new Date().toISOString();
  await admin
    .from('carrier_integrations')
    .update({
      last_synced_at: now,
      updated_at: now,
    })
    .eq('org_id', orgId)
    .eq('provider', 'geotab');

  return { ok: true, vehicles: vehiclesUpserted };
}
