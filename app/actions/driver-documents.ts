'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scanDocument } from '@/app/actions/scan-document';
import type { DriverDocumentType } from '@/app/actions/scan-document';

const BUCKET = 'dq-documents';

export type SaveDriverDocumentResult =
  | { ok: true; id: string; documentType: DriverDocumentType; expiryDate: string | null }
  | { ok: false; error: string };

/** Upload one file, AI-identify type and expiry, save to driver_documents. */
export async function saveDriverDocument(
  orgId: string,
  driverId: string,
  formData: FormData
): Promise<SaveDriverDocumentResult> {
  const file = formData.get('file') as File | null;
  if (!file?.size) {
    return { ok: false, error: 'No file provided.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Unauthorized.' };
  }

  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('id', driverId)
    .eq('org_id', orgId)
    .single();

  if (driverErr || !driver) {
    return { ok: false, error: 'Driver not found.' };
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  if (!orgMember && !profile) {
    return { ok: false, error: 'Access denied.' };
  }

  const scanResult = await scanDocument(formData);
  if (!scanResult.ok) {
    return { ok: false, error: scanResult.error };
  }

  const admin = createAdminClient();
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${orgId}/${driverId}/driver_docs/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    if (
      uploadError.message?.includes('Bucket not found') ||
      uploadError.message?.includes('not found')
    ) {
      await admin.storage.createBucket(BUCKET, { public: false });
      const { error: retry } = await admin.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (retry) return { ok: false, error: retry.message };
    } else {
      return { ok: false, error: uploadError.message };
    }
  }

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = publicUrl.publicUrl;

  const { data: row, error: insertErr } = await supabase
    .from('driver_documents')
    .insert({
      driver_id: driverId,
      document_type: scanResult.documentType,
      file_url: fileUrl,
      expiry_date: scanResult.expiryDate || null,
    })
    .select('id, document_type, expiry_date')
    .single();

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  return {
    ok: true,
    id: row.id,
    documentType: row.document_type as DriverDocumentType,
    expiryDate: row.expiry_date,
  };
}
