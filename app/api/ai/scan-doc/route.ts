import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWorker } from 'tesseract.js';
import { parseDocText } from '@/lib/parse-doc-text';
import { getDaysUntil } from '@/lib/compliance';

const DOC_TYPES = ['med_card', 'cdl', 'mvr'] as const;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function computeAlertStatus(expirationDate: string | null): 'green' | 'amber' | 'red' | null {
  if (!expirationDate) return null;
  const days = getDaysUntil(expirationDate);
  if (days === null) return null;
  if (days < 0) return 'red';
  if (days < 7) return 'red';
  if (days < 30) return 'amber';
  return 'green';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const driverId = formData.get('driverId') as string | null;
  const docType = (formData.get('docType') as string)?.trim().toLowerCase();

  if (!file?.size || !driverId) {
    return NextResponse.json({ error: 'Missing file or driverId' }, { status: 400 });
  }
  if (!DOC_TYPES.includes(docType as (typeof DOC_TYPES)[number])) {
    return NextResponse.json({ error: 'docType must be med_card, cdl, or mvr' }, { status: 400 });
  }

  if (!IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only image uploads (JPEG, PNG, WebP) are supported for scanning. PDF support coming soon.' },
      { status: 400 }
    );
  }

  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('id', driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', driver.org_id)
    .single();
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', driver.org_id)
    .single();
  if (!orgMember && !profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(buffer);
    text = data.text;
    await worker.terminate();
  } catch (err) {
    console.error('[scan-doc] OCR failed:', err);
    return NextResponse.json(
      { error: 'Document scan failed. Try a clearer image.' },
      { status: 500 }
    );
  }

  const parsed = parseDocText(text);
  const alertStatus = computeAlertStatus(parsed.expirationDate);

  const { error: upsertErr } = await supabase
    .from('driver_qualifications')
    .upsert(
      {
        driver_id: driverId,
        doc_type: docType,
        expiration_date: parsed.expirationDate || null,
        issue_date: parsed.issueDate || null,
        driver_name: parsed.driverName || null,
        alert_status: alertStatus,
        scanned_at: new Date().toISOString(),
      },
      { onConflict: 'driver_id,doc_type' }
    );

  if (upsertErr) {
    console.error('[scan-doc] Supabase upsert failed:', upsertErr);
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  if (docType === 'med_card' && parsed.expirationDate) {
    await supabase
      .from('drivers')
      .update({ med_card_expiry: parsed.expirationDate, updated_at: new Date().toISOString() })
      .eq('id', driverId);
  }

  return NextResponse.json({
    ok: true,
    expirationDate: parsed.expirationDate,
    issueDate: parsed.issueDate,
    driverName: parsed.driverName,
    alertStatus,
  });
}
