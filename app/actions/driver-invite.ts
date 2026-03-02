'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';

const INVITE_EXPIRES_DAYS = 7;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'VantagFleet <info@vantagfleet.com>';

export type InviteDriverResult =
  | { ok: true; driver: { id: string; name: string; license_number: string | null; license_state: string | null; med_card_expiry: string | null; clearinghouse_status: string | null } }
  | { ok: false; error: string };

/**
 * Create a driver record, a driver_invitation with unique token, and send invite email.
 * Caller must be authenticated and belong to orgId.
 */
export async function inviteDriver(
  orgId: string,
  params: {
    email: string;
    name: string;
    licenseNumber?: string;
    licenseState?: string;
    medCardExpiry?: string;
    clearinghouseStatus?: string;
  }
): Promise<InviteDriverResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Unauthorized.' };
  }

  const email = params.email?.trim()?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Valid driver email is required.' };
  }

  const name = params.name?.trim();
  if (!name) {
    return { ok: false, error: 'Driver name is required.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const { data: member } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  if (!profile && !member) {
    return { ok: false, error: 'You do not have access to this organization.' };
  }

  const admin = createAdminClient();

  const { data: driver, error: driverErr } = await admin
    .from('drivers')
    .insert({
      org_id: orgId,
      name,
      license_number: params.licenseNumber?.trim() || null,
      license_state: params.licenseState?.trim() || null,
      med_card_expiry: params.medCardExpiry || null,
      clearinghouse_status: params.clearinghouseStatus?.trim() || null,
    })
    .select('id, name, license_number, license_state, med_card_expiry, clearinghouse_status')
    .single();

  if (driverErr || !driver) {
    return { ok: false, error: driverErr?.message ?? 'Failed to create driver.' };
  }

  const token =
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRES_DAYS);

  const { error: invErr } = await admin.from('driver_invitations').insert({
    driver_id: driver.id,
    org_id: orgId,
    email,
    token,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
  });

  if (invErr) {
    return { ok: false, error: invErr.message };
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof process !== 'undefined' && process.env?.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : '');
  const inviteLink = `${base}/register/driver?token=${encodeURIComponent(token)}`;

  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();
  const orgName = (org as { name?: string } | null)?.name ?? 'your carrier';

  const emailResult = await sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: 'Set up your VantagFleet Roadside Shield',
    text: `${orgName} invited you to join VantagFleet. Set up your Roadside Shield and upload your CDL here: ${inviteLink}\n\nSet your password and access your documents. This link expires in ${INVITE_EXPIRES_DAYS} days.`,
    html: inviteEmailHtml(orgName, inviteLink, INVITE_EXPIRES_DAYS),
  });

  if (emailResult && 'error' in emailResult) {
    return { ok: false, error: `Invite created but email failed: ${emailResult.error}` };
  }

  return {
    ok: true,
    driver: {
      id: driver.id,
      name: driver.name,
      license_number: driver.license_number,
      license_state: driver.license_state,
      med_card_expiry: driver.med_card_expiry,
      clearinghouse_status: driver.clearinghouse_status,
    },
  };
}

function inviteEmailHtml(orgName: string, inviteLink: string, expiresDays: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="border:1px solid rgba(245,158,11,0.3);border-radius:16px;background:rgba(15,23,42,0.95);padding:28px;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#f59e0b;">VantagFleet</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f59e0b;">Set up your VantagFleet Roadside Shield</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cbd5e1;"><strong>${escapeHtml(orgName)}</strong> invited you. Set your password to access your <strong>Roadside Shield</strong> and upload your CDL.</p>
      <p style="margin:0 0 24px;"><a href="${escapeHtml(inviteLink)}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:600;text-decoration:none;border-radius:8px;">Set password &amp; get started</a></p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">This link expires in ${expiresDays} days. If you didn't expect this email, you can ignore it.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type AcceptDriverInviteResult = { ok: true } | { ok: false; error: string };

/**
 * After driver signs up via invite link: link their profile to the driver/org and mark invite accepted.
 */
export async function acceptDriverInvite(token: string): Promise<AcceptDriverInviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'You must be signed in. Complete the form above first.' };
  }

  const { data: rows } = await supabase.rpc('get_driver_invite_by_token', {
    invite_token: token.trim(),
  });
  const row = Array.isArray(rows) ? rows[0] : rows;
  const invite = row as { driver_id?: string; org_id?: string; email?: string; status?: string } | undefined;
  if (!invite?.driver_id || !invite?.org_id) {
    return { ok: false, error: 'Invalid or expired invite link.' };
  }

  if ((invite.email ?? '').toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return { ok: false, error: 'This invite was sent to a different email address.' };
  }

  const admin = createAdminClient();

  const { error: updateInviteErr } = await admin
    .from('driver_invitations')
    .update({ status: 'accepted' })
    .eq('token', token.trim());

  if (updateInviteErr) {
    return { ok: false, error: updateInviteErr.message };
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (existingProfile) {
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        org_id: invite.org_id,
        driver_id: invite.driver_id,
        role: 'Driver',
      })
      .eq('user_id', user.id);
    if (profileErr) {
      return { ok: false, error: profileErr.message };
    }
  } else {
    const { error: insertErr } = await admin.from('profiles').insert({
      id: user.id,
      user_id: user.id,
      org_id: invite.org_id,
      driver_id: invite.driver_id,
      role: 'Driver',
    });
    if (insertErr) {
      return { ok: false, error: insertErr.message };
    }
  }

  return { ok: true };
}
