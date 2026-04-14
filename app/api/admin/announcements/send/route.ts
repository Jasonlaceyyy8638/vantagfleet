import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertVantagControlAdmin } from '@/lib/admin/control-access';
import { logVantagControlAudit } from '@/lib/vantag-control-audit';
import { countOrgsBySegment, type OrgSegment } from '@/lib/vantag-control-segments';

/**
 * Marks a draft or scheduled announcement as sent and records recipient count (segment).
 * Email delivery can be wired to SendGrid later; pipeline is audited here.
 */
export async function POST(request: NextRequest) {
  const gate = await assertVantagControlAdmin();
  if (!gate.ok) return gate.response;

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from('vantag_announcements')
    .select('id, status, segment')
    .eq('id', id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (row.status === 'sent') {
    return NextResponse.json({ error: 'Already sent' }, { status: 400 });
  }

  const segment = row.segment as OrgSegment;
  const recipientCount = await countOrgsBySegment(segment);
  const sentAt = new Date().toISOString();

  const { error: upErr } = await admin
    .from('vantag_announcements')
    .update({
      status: 'sent',
      sent_at: sentAt,
      recipient_count: recipientCount,
      updated_at: sentAt,
    })
    .eq('id', id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await logVantagControlAudit({
    action: 'announcement_sent',
    actorEmail: gate.email,
    actorUserId: gate.user.id,
    metadata: {
      announcement_id: id,
      segment,
      recipient_count: recipientCount,
    },
  });

  return NextResponse.json({
    ok: true,
    sent_at: sentAt,
    recipient_count: recipientCount,
    note: 'Email delivery not yet wired; counts and audit recorded.',
  });
}
