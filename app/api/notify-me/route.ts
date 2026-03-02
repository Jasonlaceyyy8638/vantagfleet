import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const ORG_COOKIE = 'vantag-current-org-id';
const VALID_PROVIDERS = ['geotab', 'samsara'] as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { provider?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const provider = typeof body.provider === 'string' ? body.provider.toLowerCase() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!VALID_PROVIDERS.includes(provider as 'geotab' | 'samsara')) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ORG_COOKIE)?.value ?? null;

  const { error } = await supabase.from('integration_wishlist').insert({
    provider,
    email,
    org_id: orgId || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
