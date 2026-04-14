import { createAdminClient } from '@/lib/supabase/admin';

export type VantagControlAuditAction =
  | 'resource_created'
  | 'resource_updated'
  | 'resource_deleted'
  | 'resource_published'
  | 'announcement_created'
  | 'announcement_updated'
  | 'announcement_sent'
  | 'announcement_scheduled';

export async function logVantagControlAudit(params: {
  action: VantagControlAuditAction | string;
  actorEmail: string;
  actorUserId: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('vantag_control_audit_log').insert({
      action: params.action,
      actor_email: params.actorEmail,
      actor_user_id: params.actorUserId,
      metadata: params.metadata ?? null,
    });
  } catch {
    // non-fatal
  }
}
