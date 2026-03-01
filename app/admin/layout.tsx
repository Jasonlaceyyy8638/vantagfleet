import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/admin/support" className="font-semibold text-cyber-amber">
          VantagFleet Admin
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs text-soft-cloud/60 uppercase tracking-wider">
            {role}
          </span>
          <Link
            href="/dashboard"
            className="text-sm text-soft-cloud/80 hover:text-soft-cloud"
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="p-6 md:p-8">{children}</main>
    </div>
  );
}
