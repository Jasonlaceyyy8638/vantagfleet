import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_FEATURES = ['boc3', 'mcs150', 'ifta'] as const;

export async function POST(request: NextRequest) {
  let body: { email?: string; dotNumber?: string; feature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const dotNumber = typeof body.dotNumber === 'string' ? body.dotNumber.trim() || null : null;
  const feature = typeof body.feature === 'string' ? body.feature.toLowerCase() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }
  if (!VALID_FEATURES.includes(feature as (typeof VALID_FEATURES)[number])) {
    return NextResponse.json({ error: 'Invalid feature. Use boc3, mcs150, or ifta.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('leads_compliance_roadmap').insert({
    email,
    dot_number: dotNumber,
    feature_interest: feature,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
