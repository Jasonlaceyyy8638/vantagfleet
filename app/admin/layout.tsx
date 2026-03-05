import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, canAccessAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
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
      <div className="min-h-screen bg-midnight-ink text-soft-cloud flex">
        <AdminSidebar role={role ?? 'ADMIN'} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </AdminPinGate>
  );
}
