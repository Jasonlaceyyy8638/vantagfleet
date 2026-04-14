import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, canAccessAdmin } from '@/lib/admin';
import { canAccessVantagControlAdmin } from '@/lib/admin/control-access';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminShell } from './AdminShell';
import { AdminPinGate } from '@/components/AdminPinGate';

/** Next.js redirect() throws; rethrow so redirects are not swallowed by catch. */
function isRedirect(err: unknown): boolean {
  const d = (err as { digest?: string })?.digest;
  return d === 'NEXT_REDIRECT';
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const pathname = (await headers()).get('x-vf-pathname') ?? '';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && (user.user_metadata as Record<string, unknown>)?.must_change_password === true) {
      redirect('/account/change-password?required=1');
    }

    if (pathname.startsWith('/admin/control-center')) {
      if (!user) redirect('/login');
      if (!canAccessVantagControlAdmin(user.email)) notFound();
      return <>{children}</>;
    }

    const canAccess = await canAccessAdmin(supabase);
    if (!canAccess) redirect('/');

    const role = await getPlatformRole(supabase);

    return (
      <AdminPinGate>
        <AdminShell role={role ?? 'ADMIN'}>{children}</AdminShell>
      </AdminPinGate>
    );
  } catch (err) {
    if (isRedirect(err)) throw err;
    redirect('/');
  }
}
