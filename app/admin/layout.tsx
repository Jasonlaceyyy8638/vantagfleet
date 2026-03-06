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
  const canAccess = await canAccessAdmin(supabase);
  if (!canAccess) redirect('/');

  const role = await getPlatformRole(supabase);

  return (
    <AdminPinGate>
      <AdminShell role={role ?? 'ADMIN'}>{children}</AdminShell>
    </AdminPinGate>
  );
}
