'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type IntegrationProvider = 'samsara' | 'motive' | 'fmcsa';

export type IntegrationRow = {
  id: string;
  org_id: string;
  provider: string;
  created_at: string;
  /** Masked for display; never return raw credential. */
  connected: boolean;
  /** When fleet data was last synced (e.g. Motive). */
  last_synced_at: string | null;
};

/** Ensure current user belongs to the org. */
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

/** Connect FMCSA using the platform's FMCSA_WEBKEY. No API key required from the carrier. */
export async function connectFmcsaWithPlatformKey(orgId: string): Promise<{ ok: true } | { error: string }> {
  const allowed = await ensureUserInOrg(orgId);
  if (!allowed) return { error: 'You do not have access to this organization.' };

  const platformKey = process.env.FMCSA_WEBKEY?.trim();
  if (!platformKey) return { error: 'FMCSA is not configured. Contact support.' };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('carrier_integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', 'fmcsa')
    .maybeSingle();

  const credential = 'platform'; // Sentinel: use process.env.FMCSA_WEBKEY server-side when calling FMCSA APIs.

  if (existing) {
    const { error } = await supabase
      .from('carrier_integrations')
      .update({ credential, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('carrier_integrations')
      .insert({ org_id: orgId, provider: 'fmcsa', credential });
    if (error) return { error: error.message };
  }
  return { ok: true };
}

/** Save or update integration credential for the given org. Caller must be in org. */
export async function saveIntegration(
  orgId: string,
  provider: IntegrationProvider,
  credential: string
): Promise<{ ok: true } | { error: string }> {
  const allowed = await ensureUserInOrg(orgId);
  if (!allowed) return { error: 'You do not have access to this organization.' };

  const trimmed = credential?.trim();
  if (!trimmed) return { error: 'API Key or Client ID is required.' };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('carrier_integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', provider)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('carrier_integrations')
      .update({ credential: trimmed, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('carrier_integrations')
      .insert({ org_id: orgId, provider, credential: trimmed });
    if (error) return { error: error.message };
  }
  return { ok: true };
}

/** List integrations for an org (connected or not). User must be in org. */
export async function getIntegrationsForOrg(orgId: string): Promise<IntegrationRow[]> {
  const allowed = await ensureUserInOrg(orgId);
  if (!allowed) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('carrier_integrations')
    .select('id, org_id, provider, created_at, last_synced_at')
    .eq('org_id', orgId);

  const providers: IntegrationProvider[] = ['samsara', 'motive', 'fmcsa'];
  const rowList = rows ?? [];
  const byProvider = new Map<string, { id: string; org_id: string; provider: string; created_at: string; last_synced_at: string | null }>(
    rowList.map((r) => [r.provider, { ...r, last_synced_at: (r as { last_synced_at?: string | null }).last_synced_at ?? null }])
  );

  return providers.map((provider) => {
    const row = byProvider.get(provider);
    return {
      id: row?.id ?? '',
      org_id: orgId,
      provider,
      created_at: row?.created_at ?? '',
      connected: !!row,
      last_synced_at: row?.last_synced_at ?? null,
    };
  });
}

/** Run compliance sync for an org: create alerts for expired CDL/med and missing inspection. Uses admin client to insert alerts. */
export async function runComplianceSync(orgId: string): Promise<{ ok: true; alertsCreated: number } | { error: string }> {
  const allowed = await ensureUserInOrg(orgId);
  if (!allowed) return { error: 'You do not have access to this organization.' };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Compliance sync is temporarily unavailable.' };
  }
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let alertsCreated = 0;

  // Drivers: med_card_expiry in the past -> expired_cdl (we use med as proxy for driver compliance)
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name, med_card_expiry')
    .eq('org_id', orgId);

  const { data: existingAlerts } = await admin
    .from('compliance_alerts')
    .select('entity_id, alert_type')
    .eq('org_id', orgId)
    .is('resolved_at', null);
  const existingSet = new Set((existingAlerts ?? []).map((a) => `${a.entity_id}:${a.alert_type}`));

  for (const d of drivers ?? []) {
    if (d.med_card_expiry && d.med_card_expiry < today && !existingSet.has(`${d.id}:expired_cdl`)) {
      const { error } = await admin.from('compliance_alerts').insert({
        org_id: orgId,
        alert_type: 'expired_cdl',
        entity_type: 'driver',
        entity_id: d.id,
        message: `Driver ${d.name ?? 'Unknown'} has expired medical card (${d.med_card_expiry}).`,
      });
      if (!error) {
        alertsCreated++;
        existingSet.add(`${d.id}:expired_cdl`);
      }
    }
  }

  // Vehicles: annual_inspection_due in the past or no inspection -> missing_inspection
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, unit_number, vin, annual_inspection_due')
    .eq('org_id', orgId);

  for (const v of vehicles ?? []) {
    const needsAlert =
      (v.annual_inspection_due && v.annual_inspection_due < today) ||
      !v.annual_inspection_due;
    if (needsAlert && !existingSet.has(`${v.id}:missing_inspection`)) {
      const label = v.unit_number || v.vin || v.id.slice(0, 8);
      const { error } = await admin.from('compliance_alerts').insert({
        org_id: orgId,
        alert_type: 'missing_inspection',
        entity_type: 'vehicle',
        entity_id: v.id,
        message: `Vehicle ${label} is missing or past-due annual inspection.`,
      });
      if (!error) {
        alertsCreated++;
        existingSet.add(`${v.id}:missing_inspection`);
      }
    }
  }

  return { ok: true, alertsCreated };
}
