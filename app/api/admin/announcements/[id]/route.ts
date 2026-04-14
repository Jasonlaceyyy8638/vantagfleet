import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertVantagControlAdmin } from '@/lib/admin/control-access';
import { logVantagControlAudit } from '@/lib/vantag-control-audit';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.title === 'string') updates.title = body.title.trim();
  if (typeof body.excerpt === 'string' || body.excerpt === null) updates.excerpt = body.excerpt;
  if (typeof body.body_md === 'string') updates.body_md = body.body_md;
  if (typeof body.segment === 'string' && ['all', 'trial', 'paid'].includes(body.segment)) {
    updates.segment = body.segment;
  }
  if (body.scheduled_at === null) {
    updates.scheduled_at = null;
    updates.status = 'draft';
  } else if (typeof body.scheduled_at === 'string' && body.scheduled_at.trim()) {
    updates.scheduled_at = body.scheduled_at.trim();
    updates.status = 'scheduled';
  }

  const { error } = await admin.from('vantag_announcements').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logVantagControlAudit({
    action: 'announcement_updated',
    actorEmail: gate.email,
    actorUserId: gate.user.id,
    metadata: { announcement_id: id },
  });

  return NextResponse.json({ ok: true });
}
