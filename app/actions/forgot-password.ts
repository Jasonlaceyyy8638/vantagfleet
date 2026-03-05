'use server';

import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';

/** For carriers and VantagFleet employees: request a temporary password by email. Always returns success to avoid email enumeration. */
export async function requestForgotPassword(
  email: string
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Email is required.' };

  const admin = createAdminClient();
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { ok: false, error: 'Something went wrong. Please try again.' };

  const found = users?.find((u) => u.email?.toLowerCase() === trimmed);
  if (found) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const tempPassword = Array.from({ length: 12 }, () => chars[randomBytes(1)[0]! % chars.length]).join('');
    const { error: updateError } = await admin.auth.admin.updateUserById(found.id, { password: tempPassword });
    if (updateError) return { ok: false, error: 'Could not reset password. Please try again.' };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantagfleet.com';
    const loginUrl = `${appUrl}/login`;
    const changePasswordUrl = `${appUrl}/account/change-password`;
    const sent = await sendEmail({
      to: trimmed,
      department: 'APP_NOTIFICATION_SUPPORT',
      subject: 'Your VantagFleet temporary password',
      text: `You requested a password reset.\n\nYour temporary password: ${tempPassword}\n\nSign in at ${loginUrl}, then go to Change password to set a new one: ${changePasswordUrl}\n\nIf you didn't request this, please sign in and change your password immediately.\n\n— VantagFleet`,
    });
    if (sent.ok !== true) {
      return { ok: false, error: 'Email could not be sent. Please try again or contact support.' };
    }
  }

  return {
    ok: true,
    message: 'If an account exists for that email, we sent a temporary password and a link to sign in and change your password.',
  };
}
