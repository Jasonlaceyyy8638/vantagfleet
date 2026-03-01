'use server';

import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'dq-documents';

export async function uploadDqDocument(
  orgId: string,
  driverId: string,
  formData: FormData
): Promise<{ error?: string; doc?: { id: string; doc_type: string; expiry_date: string | null } }> {
  const file = formData.get('file') as File | null;
  const expiryDate = (formData.get('expiry_date') as string) || null;
  const docType = (formData.get('doc_type') as string)?.trim() || 'DQ Document';

  if (!file?.size) return { error: 'No file provided' };

  const admin = createAdminClient();

  try {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${orgId}/${driverId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        await admin.storage.createBucket(BUCKET, { public: false });
        const { error: retryError } = await admin.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (retryError) return { error: retryError.message };
      } else {
        return { error: uploadError.message };
      }
    }

    const { data: doc, error: insertError } = await admin
      .from('compliance_docs')
      .insert({
        org_id: orgId,
        driver_id: driverId,
        doc_type: docType,
        file_path: path,
        expiry_date: expiryDate || null,
      })
      .select('id, doc_type, expiry_date')
      .single();

    if (insertError) return { error: insertError.message };
    return { doc: { id: doc.id, doc_type: doc.doc_type, expiry_date: doc.expiry_date } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed' };
  }
}
