'use server';

import { createClient } from '@/lib/supabase/server';
import { runMotiveSyncCore } from '@/lib/motive-sync-core';

/** Sync Motive fleet for the current user's org. User must belong to org. */
export async function syncMotiveFleet(
  orgId: string
): Promise<{ ok: true; vehicles: number; drivers: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  if (!orgIds.includes(orgId)) return { error: 'You do not have access to this organization.' };

  return runMotiveSyncCore(orgId);
}
