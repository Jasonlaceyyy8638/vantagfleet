'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const PROFILE_IMAGES_BUCKET = 'profile-images';

export type DispatcherStatus = 'Available' | 'On Break' | 'Off Duty';

export async function updateProfilePhone(
  orgId: string,
  phone: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const { error } = await supabase
    .from('profiles')
    .update({ phone: phone?.trim() || null })
    .eq('user_id', user.id)
    .eq('org_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  revalidatePath('/dispatcher/profile');
  return { ok: true };
}

export async function updateDispatcherStatus(
  orgId: string,
  status: DispatcherStatus | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const { error } = await supabase
    .from('profiles')
    .update({ dispatcher_status: status })
    .eq('user_id', user.id)
    .eq('org_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dispatcher/profile');
  revalidatePath('/driver/roadside-shield');
  return { ok: true };
}

export async function uploadProfileImage(
  orgId: string,
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const file = formData.get('file') as File | null;
  if (!file?.size) return { ok: false, error: 'No file provided.' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' };
  }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'File must be under 5 MB.' };

  const admin = createAdminClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${orgId}/${user.id}/${crypto.randomUUID()}.${ext}`;

  try {
    const { error: bucketErr } = await admin.storage.from(PROFILE_IMAGES_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (bucketErr) {
      if (bucketErr.message?.includes('Bucket not found') || bucketErr.message?.includes('not found')) {
        await admin.storage.createBucket(PROFILE_IMAGES_BUCKET, { public: true });
        const { error: retry } = await admin.storage.from(PROFILE_IMAGES_BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (retry) return { ok: false, error: retry.message };
      } else {
        return { ok: false, error: bucketErr.message };
      }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Upload failed.' };
  }

  const { data: urlData } = admin.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ profile_image_url: url })
    .eq('user_id', user.id)
    .eq('org_id', orgId);

  if (updateErr) return { ok: false, error: updateErr.message };
  revalidatePath('/profile');
  revalidatePath('/dispatcher/profile');
  revalidatePath('/driver/roadside-shield');
  revalidatePath('/dispatcher');
  return { ok: true, url };
}
