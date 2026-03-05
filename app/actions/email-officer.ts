'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import sgMail from '@sendgrid/mail';
import { getFromEmail } from '@/lib/email-addresses';

export type EmailOfficerResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Send a formal VantagFleet compliance report to an officer.
 * Pulls 'Approved' documents from driver_documents for the given driver.
 */
export async function emailOfficer(
  officerEmail: string,
  driverId: string
): Promise<EmailOfficerResult> {
  const trimmedEmail = officerEmail?.trim() ?? '';
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, error: 'Valid officer email required.' };
  }

  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: 'SendGrid is not configured.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Unauthorized.' };
  }

  const admin = createAdminClient();

  const { data: driver, error: driverErr } = await admin
    .from('drivers')
    .select('id, name, license_number, license_state, med_card_expiry, org_id')
    .eq('id', driverId)
    .single();

  if (driverErr || !driver) {
    return { ok: false, error: 'Driver not found.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', driver.org_id)
    .single();
  const { data: member } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', driver.org_id)
    .single();
  if (!profile && !member) {
    return { ok: false, error: 'You do not have access to this driver.' };
  }

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .select('name, usdot_number, address')
    .eq('id', driver.org_id)
    .single();

  if (orgErr || !org) {
    return { ok: false, error: 'Carrier not found.' };
  }

  const orgName = (org as { name?: string }).name ?? '—';
  const usdot = (org as { usdot_number?: string | null }).usdot_number ?? '—';
  const address = (org as { address?: string | null }).address ?? '—';

  const { data: docs, error: docsErr } = await admin
    .from('driver_documents')
    .select('id, document_type, file_url, status')
    .eq('driver_id', driverId);

  if (docsErr) {
    return { ok: false, error: docsErr.message };
  }

  const driverName = driver.name ?? '—';
  const licenseNumber = driver.license_number ?? '—';
  const licenseState = driver.license_state ?? '';
  const licenseDisplay =
    licenseNumber !== '—' && licenseState
      ? `${licenseNumber} (${licenseState})`
      : licenseNumber;
  const medCardStatus = driver.med_card_expiry
    ? `Valid through ${driver.med_card_expiry}`
    : 'Not on file';

  const approvedDocs =
    (docs ?? []).filter(
      (d: { status?: string | null }) => d.status === 'approved' || d.status == null
    );
  const docRows: { document_type: string; link: string }[] = [];
  for (const doc of approvedDocs) {
    const row = doc as { document_type: string; file_url?: string };
    const link = row.file_url ?? '';
    if (link) {
      docRows.push({ document_type: row.document_type, link });
    }
  }

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const html = buildReportHtml({
    timestamp,
    carrierName: orgName,
    usdot,
    address,
    driverName,
    licenseDisplay,
    medCardStatus,
    docRows,
  });

  sgMail.setApiKey(key);
  try {
    await sgMail.send({
      to: trimmedEmail,
      from: getFromEmail('APP_NOTIFICATION_SUPPORT'),
      subject: `VantagFleet Official Compliance Report — ${orgName} (USDOT ${usdot})`,
      text: `VantagFleet Official Compliance Report. Carrier: ${orgName}, USDOT: ${usdot}. Driver: ${driverName}. Document links in HTML version.`,
      html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email.';
    return { ok: false, error: message };
  }
}

function buildReportHtml(params: {
  timestamp: string;
  carrierName: string;
  usdot: string;
  address: string;
  driverName: string;
  licenseDisplay: string;
  medCardStatus: string;
  docRows: { document_type: string; link: string }[];
}): string {
  const {
    timestamp,
    carrierName,
    usdot,
    address,
    driverName,
    licenseDisplay,
    medCardStatus,
    docRows,
  } = params;

  const docList =
    docRows.length > 0
      ? docRows
          .map(
            (d) =>
              `<tr><td style="padding:8px 0;color:#64748b;">${escapeHtml(d.document_type)}</td><td style="padding:8px 0;"><a href="${escapeHtml(d.link)}" style="color:#f59e0b;word-break:break-all;">View document</a></td></tr>`
          )
          .join('\n')
      : '<tr><td colspan="2" style="padding:8px 0;color:#94a3b8;">No documents on file.</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VantagFleet Compliance Report</title>
</head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
    <div style="background:#0f172a;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
      <div style="background:linear-gradient(135deg,rgba(245,158,11,0.25) 0%,transparent 50%);padding:24px 32px;border-bottom:2px solid rgba(245,158,11,0.4);">
        <h1 style="margin:0;font-size:18px;font-weight:800;letter-spacing:0.08em;color:#f59e0b;">VANTAGFLEET OFFICIAL COMPLIANCE REPORT</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">Generated ${escapeHtml(timestamp)}</p>
      </div>
      <div style="padding:28px 32px;">
        <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:0.05em;">1. Carrier Info</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:6px 0;color:#64748b;width:120px;">Carrier Name</td><td style="padding:6px 0;font-weight:600;color:#e2e8f0;">${escapeHtml(carrierName)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">USDOT#</td><td style="padding:6px 0;font-weight:600;color:#f59e0b;">${escapeHtml(usdot)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Address</td><td style="padding:6px 0;color:#cbd5e1;">${escapeHtml(address)}</td></tr>
        </table>
        <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:0.05em;">2. Driver Info</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:6px 0;color:#64748b;width:120px;">Driver Name</td><td style="padding:6px 0;font-weight:600;color:#e2e8f0;">${escapeHtml(driverName)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">License#</td><td style="padding:6px 0;color:#cbd5e1;">${escapeHtml(licenseDisplay)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Med Card Status</td><td style="padding:6px 0;color:#cbd5e1;">${escapeHtml(medCardStatus)}</td></tr>
        </table>
        <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:0.05em;">3. Document Links</h2>
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Secure links to Insurance, Registration, IFTA, and other on-file documents.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${docList}
        </table>
      </div>
      <div style="padding:16px 32px;background:rgba(0,0,0,0.25);border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:12px;color:#64748b;">This document was generated securely by VantagFleet for DOT roadside inspection purposes.</p>
      </div>
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
