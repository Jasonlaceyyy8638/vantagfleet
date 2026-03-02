'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import sgMail from '@sendgrid/mail';

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'VantagFleet <info@vantagfleet.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vantagfleet.com';
const HIRING_PORTAL_PATH = '/documents';

const ALERT_DAYS = [30, 15, 5] as const;

export type ExpiryAlertResult = {
  sent: number;
  skipped: number;
  errors: string[];
};

/**
 * Query driver_documents where expiry_date is 30, 15, or 5 days away.
 * For each, resolve the carrier's email (org owner/member) and send a professional expiry alert.
 */
export async function runExpiryAlerts(): Promise<ExpiryAlertResult> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) {
    return { sent: 0, skipped: 0, errors: ['SENDGRID_API_KEY is not set.'] };
  }

  sgMail.setApiKey(key);
  const admin = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDates = ALERT_DAYS.map((d) => {
    const t = new Date(today);
    t.setDate(t.getDate() + d);
    return t.toISOString().slice(0, 10);
  });

  const { data: docs, error: docsErr } = await admin
    .from('driver_documents')
    .select('id, driver_id, document_type, expiry_date')
    .not('expiry_date', 'is', null)
    .in('expiry_date', targetDates);

  if (docsErr) {
    return { sent: 0, skipped: 0, errors: [docsErr.message] };
  }

  if (!docs?.length) {
    return { sent: 0, skipped: 0, errors: [] };
  }

  const driverIds = Array.from(new Set(docs.map((d) => d.driver_id)));
  const { data: drivers } = await admin.from('drivers').select('id, name, org_id').in('id', driverIds);
  const driverMap = new Map<string | null, { name: string; org_id: string }>();
  drivers?.forEach((d) => driverMap.set(d.id, { name: d.name, org_id: d.org_id }));

  const orgIds = Array.from(new Set(docs.map((d) => driverMap.get(d.driver_id)?.org_id).filter(Boolean))) as string[];
  const orgToEmail = new Map<string, string>();

  for (const orgId of orgIds) {
    const { data: profile } = await admin
      .from('profiles')
      .select('user_id')
      .eq('org_id', orgId)
      .limit(1)
      .single();
    let userId = profile?.user_id;
    if (!userId) {
      const { data: member } = await admin
        .from('organization_members')
        .select('user_id')
        .eq('org_id', orgId)
        .limit(1)
        .single();
      userId = member?.user_id;
    }
    if (!userId) continue;
    try {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      const email = authData?.user?.email;
      if (email) orgToEmail.set(orgId, email);
    } catch {
      // skip if we can't resolve email
    }
  }

  const uploadUrl = `${APP_URL}${HIRING_PORTAL_PATH}`;
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    const driver = driverMap.get(doc.driver_id);
    if (!driver) {
      skipped++;
      continue;
    }
    const email = orgToEmail.get(driver.org_id);
    if (!email) {
      skipped++;
      continue;
    }

    const subject = `⚠️ ACTION REQUIRED: ${driver.name} - ${doc.document_type} Expiring Soon`;
    const html = expiryAlertHtml({
      driverName: driver.name,
      documentType: doc.document_type,
      expirationDate: doc.expiry_date ?? '',
      uploadUrl,
    });

    try {
      await sgMail.send({
        to: email,
        from: FROM_EMAIL,
        subject,
        html,
        text: `Action required: ${driver.name}'s ${doc.document_type} expires on ${doc.expiry_date}. Upload a new document at ${uploadUrl}`,
      });
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed';
      errors.push(`${doc.id}: ${msg}`);
    }
  }

  return { sent, skipped, errors };
}

function expiryAlertHtml(params: {
  driverName: string;
  documentType: string;
  expirationDate: string;
  uploadUrl: string;
}): string {
  const { driverName, documentType, expirationDate, uploadUrl } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Expiry Alert</title>
</head>
<body style="margin:0; padding:0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px;">
    <div style="border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; background: rgba(15, 23, 42, 0.95); padding: 32px; box-shadow: 0 0 40px -12px rgba(245, 158, 11, 0.15);">
      <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #f59e0b;">VantagFleet</p>
      <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #f59e0b;">Action required: document expiring soon</h1>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; color: #94a3b8;">Driver</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(driverName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Document type</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(documentType)}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Expiration date</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(expirationDate)}</td></tr>
      </table>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">Upload a new document before it expires to stay compliant.</p>
      <a href="${escapeHtml(uploadUrl)}" style="display: inline-block; padding: 14px 28px; background: #f59e0b; color: #0f172a; font-weight: 700; text-decoration: none; border-radius: 12px;">One-Click Upload → VantagFleet Hiring Portal</a>
      <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">You’re receiving this because your fleet has documents in the expiry window (30, 15, or 5 days).</p>
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
