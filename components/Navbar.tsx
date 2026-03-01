'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

type NavbarProps = {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
};

export function Navbar({ isAuthenticated = false, isAdmin = false }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-midnight-ink/80 backdrop-blur-md border-b border-white/10">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <Logo size={40} className="h-10 w-10" />
        <span className="font-bold text-soft-cloud text-lg tracking-wide hidden sm:inline">
          Vantag<span className="text-cyber-amber">Fleet</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
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
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium hover:bg-cyber-amber/30 transition-colors border border-cyber-amber/50"
                >
                  Owner Console
                </Link>
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  Revenue
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  My Fleet
                </Link>
                <Link
                  href="/compliance"
                  className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
                >
                  Compliance
                </Link>
              </>
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
