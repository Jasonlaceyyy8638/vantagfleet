import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let body: { email?: string; dotNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const dotNumber = typeof body.dotNumber === 'string' ? body.dotNumber.trim() || null : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('roadmap_leads').insert({
    email,
    dot_number: dotNumber,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
