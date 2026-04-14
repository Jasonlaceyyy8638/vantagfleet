import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertVantagControlAdmin } from '@/lib/admin/control-access';
import { logVantagControlAudit } from '@/lib/vantag-control-audit';
import { slugifyTitle } from '@/lib/slugify';

export async function GET() {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vantag_help_resources')
    .select('id, title, slug, excerpt, category, published_at, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ resources: data ?? [] });
}

export async function POST(request: NextRequest) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  let body: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    body_md?: string;
    category?: string;
    published?: boolean;
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

  const slug = (body.slug?.trim() || slugifyTitle(title)).toLowerCase();
  const category = body.category?.trim() || 'general';
  const bodyMd = body.body_md ?? '';
  const excerpt = body.excerpt?.trim() ?? null;
  const publishedAt =
    body.published === true ? new Date().toISOString() : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vantag_help_resources')
    .insert({
      title,
      slug,
      excerpt,
      body_md: bodyMd,
      category,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logVantagControlAudit({
    action: publishedAt ? 'resource_published' : 'resource_created',
    actorEmail: gate.email,
    actorUserId: gate.user.id,
    metadata: { resource_id: data?.id, slug },
  });

  return NextResponse.json({ id: data?.id });
}
