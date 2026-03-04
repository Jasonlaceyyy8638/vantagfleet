import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** POST: add email to beta waitlist (when beta spots are full). Public. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!raw) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    const email = raw.toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('beta_waitlist').insert({ email });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: 'You\'re already on the list.' });
      }
      return NextResponse.json({ error: 'Could not join waitlist. Try again.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "You're on the list. We'll be in touch." });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
