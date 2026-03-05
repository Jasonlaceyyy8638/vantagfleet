import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';
import { getDaysUntil } from '@/lib/compliance';

const ALERT_EMAIL = process.env.SENDGRID_ALERT_EMAIL ?? 'support@vantagfleet.com';

function getAlertStatus(expirationDate: string | null): 'green' | 'amber' | 'red' | null {
  if (!expirationDate) return null;
  const days = getDaysUntil(expirationDate);
  if (days === null) return null;
  if (days < 0) return 'red';
  if (days < 7) return 'red';
  if (days < 30) return 'amber';
  return 'green';
}

/** Called by cron (e.g. daily). Updates alert_status and sends Amber/Red emails. */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: rows, error: fetchErr } = await admin
    .from('driver_qualifications')
    .select('id, driver_id, doc_type, expiration_date, alert_status')
    .not('expiration_date', 'is', null);

  if (fetchErr) {
    console.error('[check-qualifications] Fetch failed:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const driversById = new Map<string, { name: string; org_id: string }>();
  if (rows?.length) {
    const driverIds = Array.from(new Set(rows.map((r) => r.driver_id)));
    const { data: drivers } = await admin.from('drivers').select('id, name, org_id').in('id', driverIds);
    drivers?.forEach((d) => driversById.set(d.id, { name: d.name, org_id: d.org_id }));
  }

  const amberList: { driverName: string; docType: string; expirationDate: string }[] = [];
  const redList: { driverName: string; docType: string; expirationDate: string }[] = [];

  for (const row of rows ?? []) {
    const newStatus = getAlertStatus(row.expiration_date);
    if (newStatus !== row.alert_status) {
      await admin
        .from('driver_qualifications')
        .update({ alert_status: newStatus })
        .eq('id', row.id);
    }
    const driver = driversById.get(row.driver_id);
    const driverName = driver?.name ?? 'Unknown';
    const docLabel = row.doc_type === 'med_card' ? 'Med Card' : row.doc_type === 'cdl' ? 'CDL' : 'MVR';
    const entry = { driverName, docType: docLabel, expirationDate: row.expiration_date! };
    if (newStatus === 'amber') amberList.push(entry);
    else if (newStatus === 'red') redList.push(entry);
  }

  if (amberList.length > 0 || redList.length > 0) {
    const subject =
      redList.length > 0
        ? `🚨 DQ Emergency: ${redList.length} doc(s) expiring in < 7 days`
        : `⚠️ DQ Alert: ${amberList.length} doc(s) expiring in < 30 days`;
    const amberText =
      amberList.length > 0
        ? `Amber (< 30 days):\n${amberList.map((a) => `- ${a.driverName} (${a.docType}) expires ${a.expirationDate}`).join('\n')}`
        : '';
    const redText =
      redList.length > 0
        ? `Red (< 7 days or expired):\n${redList.map((r) => `- ${r.driverName} (${r.docType}) expires ${r.expirationDate}`).join('\n')}`
        : '';
    const text = `VantagFleet DQ Early Warning\n\n${redText}${redText && amberText ? '\n' : ''}${amberText}`;
    await sendEmail({
      to: ALERT_EMAIL,
      from: ALERT_EMAIL,
      subject,
      text,
    });
  }

  return NextResponse.json({
    ok: true,
    updated: rows?.length ?? 0,
    amberCount: amberList.length,
    redCount: redList.length,
  });
}
