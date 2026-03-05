import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { EMAIL_SUPPORT, getFromEmail } from '@/lib/email-addresses';

const SUPPORT_EMAIL = EMAIL_SUPPORT;

const SUBJECT_OPTIONS = [
  'ELD Connection Issue',
  'ELD Connection Error',
  'Billing Question',
  'IFTA Discrepancy',
  'Other',
] as const;

const URGENCY_OPTIONS = ['Low', 'Medium', 'High'] as const;

/** GET: Return context for the support ticket form (company name, DOT, ELD provider). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to submit a support ticket.' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return NextResponse.json(
      { error: 'Select an organization first.', companyName: null, dotNumber: null, eldProvider: null },
      { status: 200 }
    );
  }

  const [{ data: org }, { data: integrations }] = await Promise.all([
    supabase.from('organizations').select('name, usdot_number').eq('id', orgId).single(),
    supabase.from('carrier_integrations').select('provider').eq('org_id', orgId),
  ]);

  const companyName = (org as { name?: string } | null)?.name ?? null;
  const dotNumber = (org as { usdot_number?: string | null } | null)?.usdot_number ?? null;
  const rows = (integrations ?? []) as { provider: string }[];
  const eldProviders = rows
    .map((r) => r.provider)
    .filter((p) => p === 'motive' || p === 'geotab');
  const eldProvider = eldProviders.length > 0 ? eldProviders.join(', ') : null;

  return NextResponse.json({
    companyName,
    dotNumber,
    eldProvider,
    userId: user.id,
  });
}

/** POST: Submit support ticket and send email to support@. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to submit a support ticket.' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return NextResponse.json({ error: 'Select an organization first.' }, { status: 400 });
  }

  let body: { subject?: string; description?: string; urgency?: string; currentUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const urgency = typeof body.urgency === 'string' ? body.urgency.trim() : '';
  const currentUrl = typeof body.currentUrl === 'string' ? body.currentUrl.trim() : '';

  if (!subject) return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  if (!urgency) return NextResponse.json({ error: 'Urgency is required.' }, { status: 400 });

  const validSubject = SUBJECT_OPTIONS.includes(subject as (typeof SUBJECT_OPTIONS)[number]) ? subject : 'Other';
  const validUrgency = URGENCY_OPTIONS.includes(urgency as (typeof URGENCY_OPTIONS)[number]) ? urgency : 'Medium';

  const [{ data: org }, { data: integrations }] = await Promise.all([
    supabase.from('organizations').select('name, usdot_number').eq('id', orgId).single(),
    supabase.from('carrier_integrations').select('provider').eq('org_id', orgId),
  ]);

  const companyName = (org as { name?: string } | null)?.name ?? 'Unknown';
  const dotNumber = (org as { usdot_number?: string | null } | null)?.usdot_number ?? '—';
  const rows = (integrations ?? []) as { provider: string }[];
  const eldProviders = rows
    .map((r) => r.provider)
    .filter((p) => p === 'motive' || p === 'geotab');
  const eldProvider = eldProviders.length > 0 ? eldProviders.join(', ') : 'None';

  const emailSubject = `[Support Ticket] ${validSubject} - ${companyName} (DOT: ${dotNumber})`;

  const emailBody = [
    '--- FLEET INFO ---',
    `Company: ${companyName}`,
    `DOT Number: ${dotNumber}`,
    `ELD Provider: ${eldProvider}`,
    '',
    '--- MESSAGE ---',
    `Subject: ${validSubject}`,
    `Urgency: ${validUrgency}`,
    '',
    description,
    '',
    '--- TECHNICAL METADATA ---',
    `User ID: ${user.id}`,
    `Org ID: ${orgId}`,
    `Page URL: ${currentUrl || '(not provided)'}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n');

  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) {
    console.error('[support-ticket] SENDGRID_API_KEY not set');
    return NextResponse.json({ error: 'Email is not configured. Please try again later.' }, { status: 500 });
  }

  const from = getFromEmail('APP_NOTIFICATION_SUPPORT');
  const fromName = from.includes('<') ? from.replace(/^([^<]+)\s*<.+>$/, '$1').trim() : 'VantagFleet Support';
  const fromAddr = from.includes('<') ? from.replace(/^.+<([^>]+)>$/, '$1').trim() : from;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: SUPPORT_EMAIL }] }],
        from: { email: fromAddr, name: fromName },
        subject: emailSubject,
        content: [{ type: 'text/plain', value: emailBody }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[support-ticket] SendGrid error:', res.status, err);
      return NextResponse.json({ error: 'Failed to send ticket. Please try again.' }, { status: 500 });
    }
  } catch (err) {
    console.error('[support-ticket] Send failed:', err);
    return NextResponse.json({ error: 'Failed to send ticket. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    companyName,
    dotNumber: dotNumber ?? '—',
  });
}
