'use server';

import { createClient } from '@/lib/supabase/server';

export type UpdateIftaReceiptResult =
  | { ok: true }
  | { ok: false; error: string };

/** Update receipt fields (manual edit). Caller must own the receipt via their profile. */
export async function updateIftaReceipt(
  profileId: string,
  receiptId: string,
  updates: { receipt_date?: string | null; state?: string | null; gallons?: number | null }
): Promise<UpdateIftaReceiptResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Profile not found.' };

  const payload: Record<string, unknown> = {};
  if (updates.receipt_date !== undefined) payload.receipt_date = updates.receipt_date || null;
  if (updates.state !== undefined) payload.state = updates.state?.trim() || null;
  if (updates.gallons !== undefined) payload.gallons = updates.gallons;

  const { error } = await supabase
    .from('ifta_receipts')
    .update(payload)
    .eq('id', receiptId)
    .eq('user_id', profileId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Set receipt status to 'verified' (approve for audit). */
export async function approveIftaReceipt(
  profileId: string,
  receiptId: string
): Promise<UpdateIftaReceiptResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Profile not found.' };

  const { error } = await supabase
    .from('ifta_receipts')
    .update({ status: 'verified' })
    .eq('id', receiptId)
    .eq('user_id', profileId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
