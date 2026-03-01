import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);

  if (!isPlatformStaff(role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud flex">
      <AdminSidebar role={role ?? 'EMPLOYEE'} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 border-b border-white/10 px-6 py-3 flex items-center justify-between bg-midnight-ink/80">
          <span className="text-sm text-soft-cloud/60">Admin Portal</span>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
