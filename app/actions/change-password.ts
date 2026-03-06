'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Update the current user's password and clear must_change_password so they are no longer forced to change it.
 * Uses admin client so we can set user_metadata.must_change_password = false.
 */
export async function changePasswordAndClearRequired(
  newPassword: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const trimmed = newPassword?.trim();
  if (!trimmed || trimmed.length < 8) return { error: 'Password must be at least 8 characters.' };

  const admin = createAdminClient();
  const existing = (user.user_metadata as Record<string, unknown>) ?? {};
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: trimmed,
    data: { ...existing, must_change_password: false },
  });
  if (error) return { error: error.message };
  return { ok: true };
}
