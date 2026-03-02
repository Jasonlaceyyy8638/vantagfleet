import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const ORG_COOKIE = 'vantag-current-org-id';
const VALID_POWERUPS = ['mcs150', 'boc3'] as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { powerupType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const powerupType = typeof body.powerupType === 'string' ? body.powerupType.toLowerCase() : '';
  if (!VALID_POWERUPS.includes(powerupType as typeof VALID_POWERUPS[number])) {
    return NextResponse.json({ error: 'Invalid powerup type. Use mcs150 or boc3.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ORG_COOKIE)?.value ?? null;

  const { error } = await supabase.from('compliance_powerup_waitlist').insert({
    user_id: user.id,
    powerup_type: powerupType,
    org_id: orgId || null,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
