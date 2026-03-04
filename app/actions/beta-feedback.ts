'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';

const BUCKET = 'dq-documents';
const BUG_REPORTS_PREFIX = 'bug-reports';

export type SubmitBugReportResult = { ok: true } | { ok: false; error: string };

/** Submit a beta bug report with optional screenshot. Saves to bug_reports and storage. */
export async function submitBugReport(formData: FormData): Promise<SubmitBugReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sign in to submit feedback.' };
  }

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  const description = (formData.get('description') as string)?.trim();
  const taskName = (formData.get('task_name') as string)?.trim() || null;
  const device = (formData.get('device') as string)?.trim() || null;
  const action = (formData.get('action') as string)?.trim() || null;

  if (!description) {
    return { ok: false, error: 'Please describe the issue.' };
  }

  let screenshotPath: string | null = null;
  const file = formData.get('screenshot') as File | null;
  if (file?.size && file.size < 10 * 1024 * 1024) {
    const admin = createAdminClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeExt = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) ? ext : 'png';
    const path = `${BUG_REPORTS_PREFIX}/${orgId || 'no-org'}/${crypto.randomUUID()}.${safeExt}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'image/png',
      upsert: false,
    });
    if (!uploadError) screenshotPath = path;
  }

  const { error } = await supabase.from('bug_reports').insert({
    user_id: user.id,
    org_id: orgId || null,
    task_name: taskName,
    description,
    device,
    action,
    screenshot_path: screenshotPath,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
