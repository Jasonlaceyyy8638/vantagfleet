'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

type NavRole = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' | null;

async function getNavRole(userId: string, supabase: ReturnType<typeof createClient>): Promise<NavRole> {
  if (userId === ADMIN_OWNER_ID) return 'ADMIN';
  const { data: platform } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  if (platform?.role === 'ADMIN') return 'ADMIN';
  if (platform?.role === 'EMPLOYEE') return 'EMPLOYEE';
  const { data: userRow } = await supabase.from('users').select('role').eq('id', userId).single();
  const r = (userRow?.role as string) ?? '';
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'EMPLOYEE') return 'EMPLOYEE';
  return 'CUSTOMER';
}

const linkBase =
  'px-4 py-2.5 rounded-lg font-medium transition-colors text-soft-cloud hover:bg-white/10';
const linkActive =
  'px-4 py-2.5 rounded-lg font-medium transition-colors shadow-[0_0_16px_-2px_rgba(255,176,0,0.4)] ring-1 ring-cyber-amber/60 bg-cyber-amber/20 text-cyber-amber';

export function Navbar({ isAuthenticated: initialAuth = false }: { isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState(initialAuth);
  const [role, setRole] = useState<NavRole>(null);
  const [ready, setReady] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    const w = typeof window !== 'undefined' ? (window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown }) : null;
    const check = () => {
      if (w && (!!w.__TAURI__ || !!w.__TAURI_INTERNAL__)) return true;
      if (typeof window !== 'undefined') {
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get('tauri') === '1') {
            sessionStorage.setItem('tauri', '1');
            return true;
          }
          if (sessionStorage.getItem('tauri') === '1') return true;
        } catch {
          // ignore
        }
      }
      return false;
    };
    if (check()) setIsTauri(true);
    const t1 = setTimeout(() => { if (check()) setIsTauri(true); }, 150);
    const t2 = setTimeout(() => { if (check()) setIsTauri(true); }, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        setAuth(false);
        setRole(null);
        setReady(true);
        return;
      }
      setAuth(true);
      getNavRole(user.id, supabase).then(setRole).finally(() => setReady(true));
    });
  }, []);

  const isAdmin = role === 'ADMIN';
  const isEmployee = role === 'EMPLOYEE';
  const isCustomer = role === 'CUSTOMER';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-midnight-ink/90 backdrop-blur-md border-b border-white/10"
      style={{ pointerEvents: 'auto' }}
    >
      <Link
        href="/"
        className="flex items-center gap-2 shrink-0 text-soft-cloud hover:opacity-90"
        style={{ pointerEvents: 'auto' }}
      >
        <Logo size={40} className="h-10 w-10" />
        <span className="font-bold text-lg tracking-wide hidden sm:inline">
          Vantag<span className="text-cyber-amber">Fleet</span>
        </span>
      </Link>

      <div
        className="flex items-center gap-2 flex-wrap justify-end"
        style={{ pointerEvents: 'auto' }}
      >
        {!ready && (
          <span className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" aria-hidden />
        )}
        {ready && !auth && (
          <>
            <Link href="/login" className={linkBase}>
              Sign In
            </Link>
            {!isTauri && (
              <Link
                href="/download"
                className="hidden md:inline-flex bg-amber-500 text-black px-4 py-2 rounded-md font-bold hover:bg-amber-600 transition-colors"
              >
                Download App
              </Link>
            )}
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-lg bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90"
            >
              Sign Up
            </Link>
          </>
        )}
        {ready && auth && (
          <>
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={pathname === '/admin' ? linkActive : linkBase}
                >
                  Owner Console
                </Link>
                <Link
                  href="/admin/team"
                  className={pathname.startsWith('/admin/team') ? linkActive : linkBase}
                >
                  My Team
                </Link>
                <Link
                  href="/admin/revenue"
                  className={pathname.startsWith('/admin/revenue') ? linkActive : linkBase}
                >
                  Revenue
                </Link>
              </>
            )}
            {isEmployee && (
              <>
                <Link
                  href="/admin/support"
                  className={pathname.startsWith('/admin/support') ? linkActive : linkBase}
                >
                  Support Dashboard
                </Link>
                <Link
                  href="/admin/team"
                  className={pathname.startsWith('/admin/team') ? linkActive : linkBase}
                >
                  My Team
                </Link>
              </>
            )}
            {(isCustomer || (!isAdmin && !isEmployee)) && (
              <Link
                href="/dashboard"
                className={pathname.startsWith('/dashboard') ? linkActive : linkBase}
              >
                My Fleet
              </Link>
            )}
            {!isTauri && (
              <Link
                href="/download"
                className="hidden md:inline-flex bg-amber-500 text-black px-4 py-2 rounded-md font-bold hover:bg-amber-600 transition-colors"
              >
                Download App
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.refresh();
                window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud font-medium hover:bg-white/10 inline-flex items-center gap-2"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
