import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertVantagControlAdmin } from '@/lib/admin/control-access';
import { logVantagControlAudit } from '@/lib/vantag-control-audit';

export async function GET() {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vantag_announcements')
    .select(
      'id, title, excerpt, status, scheduled_at, segment, sent_at, recipient_count, created_by_email, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(request: NextRequest) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  let body: {
    title?: string;
    excerpt?: string | null;
    body_md?: string;
    segment?: 'all' | 'trial' | 'paid';
    scheduled_at?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const segment = body.segment ?? 'all';
  if (!['all', 'trial', 'paid'].includes(segment)) {
    return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
  }

  const scheduledAt = body.scheduled_at?.trim() || null;
  const status = scheduledAt ? 'scheduled' : 'draft';

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vantag_announcements')
    .insert({
      title,
      excerpt: body.excerpt?.trim() ?? null,
      body_md: body.body_md ?? '',
      segment,
      status,
      scheduled_at: scheduledAt,
      created_by_email: gate.email,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logVantagControlAudit({
    action: scheduledAt ? 'announcement_scheduled' : 'announcement_created',
    actorEmail: gate.email,
    actorUserId: gate.user.id,
    metadata: { announcement_id: data?.id },
  });

  return NextResponse.json({ id: data?.id });
}
