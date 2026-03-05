'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type RoadsideSummary = {
  org_name?: string;
  eld_status?: { status: string; message: string };
  insurance_permits?: Array<{ type: string; expiry: string | null }>;
  recent_maintenance?: Array<{ date: string; description: string | null }>;
  error?: string;
};

/** When true, token expires in 4 hours (for officer inspection page). Otherwise 15 minutes. */
export async function createRoadsideToken(
  orgId: string,
  driverId?: string | null,
  inspectionExpiry?: boolean
): Promise<{ token?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter(Boolean)));
  if (!orgIds.includes(orgId)) return { error: 'Organization not found' };

  const expiresAt = new Date(Date.now() + (inspectionExpiry ? 4 * 60 * 60 * 1000 : 15 * 60 * 1000)).toISOString();
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('roadside_tokens')
    .insert({ org_id: orgId, driver_id: driverId || null, expires_at: expiresAt })
    .select('token')
    .single();

  if (error) return { error: error.message };
  return { token: row?.token };
}

export async function getRoadsideSummary(token: string): Promise<RoadsideSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_roadside_summary', { p_token: token });
  if (error || data?.error) return data as RoadsideSummary ?? { error: 'invalid_or_expired' };
  return data as RoadsideSummary;
}

/** Same summary shape for the logged-in org (driver view before generating QR). */
export async function getRoadsideSummaryForOrg(orgId: string): Promise<RoadsideSummary | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('user_id', user.id).eq('org_id', orgId).single();
  const { data: member } = await supabase.from('organization_members').select('org_id').eq('user_id', user.id).eq('org_id', orgId).single();
  if (!profile && !member) return null;

  const { data: org } = await supabase.from('organizations').select('name').eq('id', orgId).single();
  const { data: docs } = await supabase
    .from('compliance_docs')
    .select('doc_type, expiry_date')
    .eq('org_id', orgId)
    .limit(20);
  const { data: maintenance } = await supabase
    .from('vehicle_maintenance_logs')
    .select('log_date, description')
    .eq('org_id', orgId)
    .order('log_date', { ascending: false })
    .limit(10);

  const insurance_permits = (docs ?? []).map((d) => ({ type: d.doc_type, expiry: d.expiry_date }));
  const recent_maintenance = (maintenance ?? []).map((m) => ({ date: m.log_date, description: m.description }));

  return {
    org_name: org?.name ?? undefined,
    eld_status: { status: 'Compliant', message: 'ELD status and hours available in cab.' },
    insurance_permits,
    recent_maintenance,
  };
}
