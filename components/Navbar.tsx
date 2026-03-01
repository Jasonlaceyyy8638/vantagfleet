'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { ADMIN_OWNER_ID } from '@/lib/admin';
import type { NavbarRole } from '@/lib/admin';

type NavbarProps = {
  isAuthenticated?: boolean;
  navbarRole?: NavbarRole | null;
};

/** Resolve role client-side from platform_roles then public.users (owner ID always ADMIN). */
async function resolveNavbarRole(userId: string, supabase: ReturnType<typeof createClient>): Promise<NavbarRole> {
  if (userId === ADMIN_OWNER_ID) return 'ADMIN';

  const { data: platform } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const platformRole = platform?.role as string | undefined;
  if (platformRole === 'ADMIN') return 'ADMIN';
  if (platformRole === 'EMPLOYEE') return 'EMPLOYEE';

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  const r = (userRow?.role as string) ?? '';
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'EMPLOYEE') return 'EMPLOYEE';
  return 'CUSTOMER';
}

const activeNavClass = 'px-4 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_16px_-2px_rgba(255,176,0,0.4)] ring-1 ring-cyber-amber/60 bg-cyber-amber/20 text-cyber-amber';
const inactiveNavClass = 'px-4 py-2.5 rounded-lg font-medium transition-all text-soft-cloud hover:bg-white/10';

export function Navbar({ isAuthenticated: initialAuth = false, navbarRole: _initialRole }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [role, setRole] = useState<NavbarRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        setIsAuthenticated(false);
        setRole(null);
        setReady(true);
        return;
      }
      setIsAuthenticated(true);
      resolveNavbarRole(user.id, supabase).then((r) => {
        setRole(r);
        setReady(true);
      });
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/';
  };

  const isAdmin = role === 'ADMIN' || role === 'OWNER';
  const isEmployee = role === 'EMPLOYEE';
  const isCustomer = role === 'CUSTOMER';

  const isOwnerConsoleActive = pathname === '/admin';
  const isTeamActive = pathname.startsWith('/admin/team');
  const isRevenueActive = pathname.startsWith('/admin/revenue');
  const isSupportActive = pathname.startsWith('/admin/support');
  const isDashboardActive = pathname.startsWith('/dashboard');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-midnight-ink/80 backdrop-blur-md border-b border-white/10">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <Logo size={40} className="h-10 w-10" />
        <span className="font-bold text-soft-cloud text-lg tracking-wide hidden sm:inline">
          Vantag<span className="text-cyber-amber">Fleet</span>
        </span>
      </Link>
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {!ready ? (
          <div className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" aria-hidden />
        ) : !isAuthenticated ? (
          <>
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-lg bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 transition-colors"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <>
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={isOwnerConsoleActive ? activeNavClass : inactiveNavClass}
                >
                  Owner Console
                </Link>
                <Link
                  href="/admin/team"
                  className={isTeamActive ? activeNavClass : inactiveNavClass}
                >
                  My Team
                </Link>
                <Link
                  href="/admin/revenue"
                  className={isRevenueActive ? activeNavClass : inactiveNavClass}
                >
                  Revenue
                </Link>
              </>
            )}
            {isEmployee && (
              <>
                <Link
                  href="/admin/support"
                  className={isSupportActive ? activeNavClass : inactiveNavClass}
                >
                  Support Dashboard
                </Link>
                <Link
                  href="/admin/team"
                  className={isTeamActive ? activeNavClass : inactiveNavClass}
                >
                  My Team
                </Link>
              </>
            )}
            {isCustomer && (
              <Link
                href="/dashboard"
                className={isDashboardActive ? activeNavClass : inactiveNavClass}
              >
                My Fleet
              </Link>
            )}
            {isAuthenticated && !isAdmin && !isEmployee && !isCustomer && (
              <Link
                href="/dashboard"
                className={isDashboardActive ? activeNavClass : inactiveNavClass}
              >
                My Fleet
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud font-medium hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
