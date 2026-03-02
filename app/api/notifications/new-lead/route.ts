import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

const JASON_EMAIL = 'info@vantagfleet.com';
const FROM_NAMED = 'Jason at VantagFleet <info@vantagfleet.com>';

function welcomeEmailHtml(dotNumber: string): string {
  const dotDisplay = dotNumber || '—';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VantagFleet</title>
</head>
<body style="margin:0; padding:0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px;">
    <div style="border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; background: rgba(15, 23, 42, 0.95); padding: 32px; box-shadow: 0 0 40px -12px rgba(245, 158, 11, 0.15);">
      <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #f59e0b;">VantagFleet</p>
      <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #f59e0b;">Welcome to the Compliance Alpha</h1>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">Hey there,</p>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">Thanks for joining the waitlist for VantagFleet. We've logged your interest for DOT #${dotDisplay}.</p>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">Our mission is to take the guesswork out of FMCSA compliance so you can focus on the road. We'll notify you the moment our Samsara one-click integration and automated BOC-3 filings are live.</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">In the meantime, welcome to the future of fleet management.</p>
      <p style="margin: 0; font-size: 16px; color: #f59e0b; font-weight: 600;">— Jason Lacey, Founder</p>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function POST(request: NextRequest) {
  let body: { email?: string; dotNumber?: string; featureInterest?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const dotNumber = typeof body.dotNumber === 'string' ? body.dotNumber.trim() : '';
  const featureInterest = typeof body.featureInterest === 'string' ? body.featureInterest.trim() : 'General';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }

  // 1. THE ALERT (To Jason) — best-effort; don't fail the request
  const alertSubject = `🔥 New Compliance Lead: DOT #${dotNumber || '—'}`;
  const alertText = `Jason, a new carrier just joined the waitlist!
Email: ${email}
DOT: ${dotNumber || '—'}
Interested in: ${featureInterest}`;

  const alertResult = await sendEmail({
    to: JASON_EMAIL,
    from: JASON_EMAIL,
    subject: alertSubject,
    text: alertText,
  });
  if ('error' in alertResult) {
    console.error('[new-lead] Alert email failed:', alertResult.error);
  }

  // 2. THE WELCOME (To the customer) — best-effort; don't fail the request
  const welcomeText = `Hey there,\n\nThanks for joining the waitlist for VantagFleet. We've logged your interest for DOT #${dotNumber || '—'}.\n\nOur mission is to take the guesswork out of FMCSA compliance so you can focus on the road. We'll notify you the moment our Samsara one-click integration and automated BOC-3 filings are live.\n\nIn the meantime, welcome to the future of fleet management.\n\n— Jason Lacey, Founder`;
  const welcomeResult = await sendEmail({
    to: email,
    from: FROM_NAMED,
    subject: 'Welcome to the VantagFleet Compliance Alpha',
    text: welcomeText,
    html: welcomeEmailHtml(dotNumber),
  });
  if ('error' in welcomeResult) {
    console.error('[new-lead] Welcome email failed:', welcomeResult.error);
  }

  // Always return success so the client doesn't retry; lead is already in Supabase.
  return NextResponse.json({
    ok: true,
    alertSent: !('error' in alertResult),
    welcomeSent: !('error' in welcomeResult),
  });
}
