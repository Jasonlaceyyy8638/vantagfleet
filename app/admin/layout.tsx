import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (!admin) redirect('/');

  const role = await getPlatformRole(supabase);

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud flex">
      <AdminSidebar role={role ?? 'ADMIN'} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
