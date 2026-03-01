'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';

export type StaffRow = { user_id: string; role: string; email: string | null };

async function requireStaff() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) throw new Error('Forbidden');
}

/** List current staff (platform_roles + email from Auth). */
export async function listStaff(): Promise<StaffRow[]> {
  await requireStaff();
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('platform_roles')
    .select('user_id, role')
    .order('role');

  if (error || !rows?.length) return [];

  const result: StaffRow[] = [];
  for (const row of rows) {
    const { data: { user } } = await admin.auth.admin.getUserById(row.user_id);
    result.push({
      user_id: row.user_id,
      role: row.role,
      email: user?.email ?? null,
    });
  }
  return result;
}

/** Add an employee by email: look up user in Auth, add to platform_roles. They must have signed up first. */
export async function addEmployeeByEmail(
  email: string,
  role: 'ADMIN' | 'EMPLOYEE'
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required.' };
  if (role !== 'ADMIN' && role !== 'EMPLOYEE') return { error: 'Invalid role.' };

  const admin = createAdminClient();
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { error: listError.message };

  const found = users?.find((u) => u.email?.toLowerCase() === trimmed);
  if (!found) {
    return { error: 'No account found with that email. They need to sign up at the app first.' };
  }

  const { error: insertError } = await admin
    .from('platform_roles')
    .upsert({ user_id: found.id, role }, { onConflict: 'user_id' });

  if (insertError) return { error: insertError.message };
  return { ok: true };
}

/** Remove staff role (they become a normal customer again). */
export async function removeStaff(userId: string): Promise<{ error?: string }> {
  await requireStaff();
  const admin = createAdminClient();
  const { error } = await admin.from('platform_roles').delete().eq('user_id', userId);
  if (error) return { error: error.message };
  return {};
}
