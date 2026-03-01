'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import type { NavbarRole } from '@/lib/admin';

type NavbarProps = {
  isAuthenticated?: boolean;
  /** From getNavbarRole (platform_roles + users.role). ADMIN/OWNER = same view. */
  navbarRole?: NavbarRole | null;
};

export function Navbar({ isAuthenticated = false, navbarRole = null }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/';
  };

  const isOwnerOrAdmin = navbarRole === 'ADMIN' || navbarRole === 'OWNER';
  const isEmployee = navbarRole === 'EMPLOYEE';
  const isCustomer = navbarRole === 'CUSTOMER';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-midnight-ink/80 backdrop-blur-md border-b border-white/10">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <Logo size={40} className="h-10 w-10" />
        <span className="font-bold text-soft-cloud text-lg tracking-wide hidden sm:inline">
          Vantag<span className="text-cyber-amber">Fleet</span>
        </span>
      </Link>
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {!isAuthenticated ? (
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
            {/* Owner / Admin: Admin Console (primary), My Team, Revenue — never send to carrier onboarding */}
            {isOwnerOrAdmin && (
              <>
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium hover:bg-cyber-amber/30 transition-colors border border-cyber-amber/50"
                >
                  Admin Console
                </Link>
                <Link
                  href="/admin/team"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  My Team
                </Link>
                <Link
                  href="/admin/revenue"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  Revenue
                </Link>
              </>
            )}
            {/* Employee: Support Dashboard, My Team (view only) */}
            {isEmployee && (
              <>
                <Link
                  href="/admin/support"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  Support Dashboard
                </Link>
                <Link
                  href="/admin/team"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  My Team
                </Link>
              </>
            )}
            {/* Carrier: only My Fleet */}
            {isCustomer && (
              <Link
                href="/dashboard"
                className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
              >
                My Fleet
              </Link>
            )}
            {/* Fallback if role not yet loaded: show My Fleet to avoid broken state */}
            {isAuthenticated && !isOwnerOrAdmin && !isEmployee && !isCustomer && (
              <Link
                href="/dashboard"
                className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
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
