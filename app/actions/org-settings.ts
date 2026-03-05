'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateDispatchPhone(
  orgId: string,
  dispatchPhone: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ dispatch_phone: dispatchPhone?.trim() || null })
    .eq('id', orgId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
