import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, canAccessAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AdminShell } from './AdminShell';
import { AdminPinGate } from '@/components/AdminPinGate';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && (user.user_metadata as Record<string, unknown>)?.must_change_password === true) {
    redirect('/account/change-password?required=1');
  }
  const canAccess = await canAccessAdmin(supabase);
  if (!canAccess) redirect('/');

  const role = await getPlatformRole(supabase);

  return (
    <AdminPinGate>
      <AdminShell role={role ?? 'ADMIN'}>{children}</AdminShell>
    </AdminPinGate>
  );
}
