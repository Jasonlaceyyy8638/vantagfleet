import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertVantagControlAdmin } from '@/lib/admin/control-access';
import { logVantagControlAudit } from '@/lib/vantag-control-audit';
import { slugifyTitle } from '@/lib/slugify';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vantag_help_resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ resource: data });
}

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
  if (typeof body.slug === 'string') updates.slug = body.slug.trim().toLowerCase();
  if (typeof body.excerpt === 'string' || body.excerpt === null) updates.excerpt = body.excerpt;
  if (typeof body.body_md === 'string') updates.body_md = body.body_md;
  if (typeof body.category === 'string') updates.category = body.category.trim();
  if (body.title && !body.slug) {
    const t = String(body.title).trim();
    if (t) updates.slug = slugifyTitle(t);
  }
  if (typeof body.published === 'boolean') {
    updates.published_at = body.published ? new Date().toISOString() : null;
  }

  const { error } = await admin.from('vantag_help_resources').update(updates).eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logVantagControlAudit({
    action: 'resource_updated',
    actorEmail: gate.email,
    actorUserId: gate.user.id,
    metadata: { resource_id: id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin.from('vantag_help_resources').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logVantagControlAudit({
    action: 'resource_deleted',
    actorEmail: gate.email,
    actorUserId: gate.user.id,
    metadata: { resource_id: id },
  });

  return NextResponse.json({ ok: true });
}
