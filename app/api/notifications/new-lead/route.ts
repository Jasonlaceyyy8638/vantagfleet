import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

const TO_EMAIL = 'info@vantagfleet.com';

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

  const subject = `🔥 New Compliance Lead: DOT #${dotNumber || '—'}`;
  const text = `Jason, a new carrier just joined the waitlist!
Email: ${email}
DOT: ${dotNumber || '—'}
Interested in: ${featureInterest}`;

  const result = await sendEmail({
    to: TO_EMAIL,
    from: TO_EMAIL,
    subject,
    text,
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
