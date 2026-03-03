'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'ifta-receipts';

export type UploadIftaReceiptResult =
  | { ok: true; id: string; file_url: string }
  | { ok: false; error: string };

/** Upload a receipt file to storage and create ifta_receipts row. Returns id and file_url for calling /api/ifta/scan. */
export async function uploadIftaReceipt(
  profileId: string,
  quarter: number,
  year: number,
  formData: FormData
): Promise<UploadIftaReceiptResult> {
  const file = formData.get('file') as File | null;
  if (!file?.size) {
    return { ok: false, error: 'No file provided.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Unauthorized.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return { ok: false, error: 'Profile not found.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  if (!['jpg', 'jpeg', 'png'].includes(ext)) {
    return { ok: false, error: 'Only JPG and PNG images are supported.' };
  }

  const admin = createAdminClient();
  const path = `${profileId}/${year}/Q${quarter}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    if (
      uploadError.message?.includes('Bucket not found') ||
      uploadError.message?.includes('not found')
    ) {
      await admin.storage.createBucket(BUCKET, { public: true });
      const { error: retry } = await admin.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (retry) return { ok: false, error: retry.message };
    } else {
      return { ok: false, error: uploadError.message };
    }
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const file_url = urlData.publicUrl;

  const { data: row, error: insertErr } = await admin
    .from('ifta_receipts')
    .insert({
      user_id: profileId,
      quarter,
      year,
      file_url,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  return { ok: true, id: row.id, file_url };
}
