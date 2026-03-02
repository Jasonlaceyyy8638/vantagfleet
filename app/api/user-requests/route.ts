import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_TYPES = ['Integration', 'Report', 'Alert'] as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { type?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = body.type?.trim();
  const description = body.description?.trim();

  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: 'Category must be Integration, Report, or Alert' }, { status: 400 });
  }
  if (!description || description.length < 3) {
    return NextResponse.json({ error: 'Please provide a description' }, { status: 400 });
  }

  const { error } = await supabase.from('user_requests').insert({
    user_id: user.id,
    type,
    description,
    status: 'New',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
