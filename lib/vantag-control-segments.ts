import { createAdminClient } from '@/lib/supabase/admin';

export type OrgSegment = 'all' | 'trial' | 'paid';

export function orgMatchesSegment(
  row: {
    subscription_status?: string | null;
    trial_active?: boolean | null;
  },
  segment: OrgSegment
): boolean {
  const trialing =
    row.subscription_status === 'trialing' || row.trial_active === true;
  if (segment === 'all') return true;
  if (segment === 'trial') return trialing;
  const paid =
    (row.subscription_status === 'active' || row.subscription_status === 'active_paid') &&
    !trialing;
  return paid;
}

export async function countOrgsBySegment(segment: OrgSegment): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('organizations')
    .select('subscription_status, trial_active');
  if (error || !data) return 0;
  return data.filter((o) => orgMatchesSegment(o, segment)).length;
}
