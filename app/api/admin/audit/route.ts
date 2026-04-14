import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertVantagControlAdmin } from '@/lib/admin/control-access';

export async function GET(request: NextRequest) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const actor = searchParams.get('actor')?.trim().toLowerCase();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

  const admin = createAdminClient();
  let query = admin
    .from('vantag_control_audit_log')
    .select('id, action, actor_email, actor_user_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (actor) {
    query = query.ilike('actor_email', `%${actor}%`);
  }
  if (from) {
    query = query.gte('created_at', from);
  }
  if (to) {
    query = query.lte('created_at', to);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
