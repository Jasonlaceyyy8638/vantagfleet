import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';

const BUCKET = 'dq-documents';
const SIGNATURE_PREFIX = 'signatures';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let body: { imageBase64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const b64 = body?.imageBase64?.trim();
  if (!b64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });

  let buffer: Buffer;
  try {
    const base64Data = b64.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    return NextResponse.json({ error: 'Invalid base64 image' }, { status: 400 });
  }
  if (buffer.length > 2 * 1024 * 1024) return NextResponse.json({ error: 'Image too large' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const filePath = `${SIGNATURE_PREFIX}/${orgId}/${user.id}/${today}.png`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: 'image/png', upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: upsertError } = await supabase
    .from('driver_daily_log_signatures')
    .upsert(
      { org_id: orgId, user_id: user.id, signature_date: today, file_path: filePath },
      { onConflict: 'org_id,user_id,signature_date' }
    );

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ ok: true, signatureDate: today });
}
