import { createAdminClient } from '@/lib/supabase/admin';

export type AdminLogAction =
  | 'refund'
  | 'organization_created'
  | 'organization_updated';

export async function logAdminAction(
  employeeId: string,
  actionTaken: AdminLogAction,
  targetCustomerId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('admin_logs').insert({
      employee_id: employeeId,
      action_taken: actionTaken,
      target_customer_id: targetCustomerId,
      details: details ?? null,
    });
  } catch {
    // Non-fatal: do not fail the main action if logging fails
  }
}
