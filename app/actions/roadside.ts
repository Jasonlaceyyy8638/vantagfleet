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

export async function createRoadsideToken(orgId: string, driverId?: string | null): Promise<{ token?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter(Boolean)));
  if (!orgIds.includes(orgId)) return { error: 'Organization not found' };

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('roadside_tokens')
    .insert({ org_id: orgId, driver_id: driverId || null })
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
