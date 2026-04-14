'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { SystemStatusIndicator, type SystemStatus } from '@/components/SystemStatusIndicator';
import { isVantagControlNavAdmin } from '@/lib/admin/control-access-client';

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

function NavbarInner({
  isAuthenticated: initialAuth = false,
  signupHref = '/signup',
  signupLabel = 'Sign Up',
  topOffsetPx = 0,
  showAnnouncementInBar = false,
}: { isAuthenticated?: boolean; signupHref?: string; signupLabel?: string; topOffsetPx?: number; showAnnouncementInBar?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLanding = pathname === '/';
  const showInBar = showAnnouncementInBar || isLanding;
  const router = useRouter();
  const [auth, setAuth] = useState(initialAuth);
  const [role, setRole] = useState<NavRole>(null);
  const [ready, setReady] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('no_eld');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isBrokerAccount, setIsBrokerAccount] = useState(false);
  const [isVantagControlUser, setIsVantagControlUser] = useState(false);

  /** `mode=demo` / `vf_demo` cookie — hide ELD/network status; map uses sandbox only. */
  useEffect(() => {
    const urlDemo =
      searchParams.get('mode') === 'demo' ||
      searchParams.get('demo') === 'true';
    const cookieDemo =
      typeof document !== 'undefined' &&
      /(?:^|;)\s*vf_demo=1(?:;|$)/.test(document.cookie);
    setDemoMode(urlDemo || cookieDemo);
  }, [pathname, searchParams]);

  /** Logged-in broker org (not demo): show Network status instead of ELD sync. */
  useEffect(() => {
    if (!ready || !auth || demoMode) {
      setIsBrokerAccount(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsBrokerAccount(false);
        return;
      }
      const { data: profs } = await supabase.from('profiles').select('account_type, org_id').eq('user_id', user.id);
      if (profs?.some((p) => (p as { account_type?: string }).account_type === 'broker')) {
        setIsBrokerAccount(true);
        return;
      }
      const ids = (profs ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
      if (ids.length === 0) {
        setIsBrokerAccount(false);
        return;
      }
      const { data: orgs } = await supabase.from('organizations').select('business_type').in('id', ids);
      setIsBrokerAccount(orgs?.some((o) => (o as { business_type?: string }).business_type === 'broker') ?? false);
    })();
  }, [ready, auth, demoMode, pathname]);

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
        setIsVantagControlUser(false);
        setReady(true);
        return;
      }
      setAuth(true);
      setIsVantagControlUser(isVantagControlNavAdmin(user.email ?? null));
      getNavRole(user.id, supabase).then(setRole).finally(() => setReady(true));
    });
  }, []);

  useEffect(() => {
    if (isLanding || demoMode || isBrokerAccount) return;
    const fetchStatus = () => {
      fetch('/api/system-status')
        .then((res) => res.json())
        .then((data: { status?: SystemStatus; lastSyncedAt?: string | null }) => {
          setSystemStatus(data?.status ?? 'no_eld');
          setLastSyncedAt(data?.lastSyncedAt ?? null);
        })
        .catch(() => setSystemStatus('no_eld'));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isLanding, demoMode, isBrokerAccount]);

  const isAdmin = role === 'ADMIN';
  const isEmployee = role === 'EMPLOYEE';
  const isCustomer = role === 'CUSTOMER';

  /** Home (`/`) and interactive demo never show fleet ELD / broker network chip (see SystemStatusIndicator). */
  const showConnectionStatus = ready && !isLanding && !demoMode;

  return (
    <header
      className="fixed left-0 right-0 z-[100] flex flex-col min-w-0 max-w-[100vw] bg-midnight-ink/95 backdrop-blur-md border-b border-white/10"
      style={{
        top: topOffsetPx,
        pointerEvents: 'auto',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Main nav — fixed row height for layout offset (see LandingPage spacer) */}
      <div className="flex h-20 flex-nowrap items-center justify-between gap-2 sm:gap-3">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 text-soft-cloud hover:opacity-90"
          style={{ pointerEvents: 'auto' }}
        >
          <Logo size={40} className="h-10 w-10 shrink-0" />
          <span className="font-bold text-lg tracking-wide hidden sm:inline truncate">
            Vantag<span className="text-cyber-amber">Fleet</span>
          </span>
        </Link>

        {showInBar && (
          <div className="hidden min-w-0 max-w-[min(28rem,42vw)] flex-col text-left md:flex lg:max-w-xl">
            <span className="text-sm lg:text-base font-bold text-slate-100 leading-snug truncate">
              The Next-Gen Operating System for Freight.
            </span>
            <span className="text-xs lg:text-sm font-medium text-cyber-amber/95 leading-snug truncate mt-0.5">
              Dispatch, Track, and Settle in One Secure Platform.
            </span>
            <span className="hidden lg:block text-[11px] text-slate-400/90 leading-relaxed mt-1 line-clamp-2">
              VantagFleet gives Carriers and Brokers a unified command center for live dispatching and high-fidelity load
              management.
            </span>
          </div>
        )}

        <div
          className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0 justify-end flex-nowrap"
          style={{ pointerEvents: 'auto' }}
        >
        {!ready && (
          <span className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" aria-hidden />
        )}
        {ready && !auth && (
          <>
            {showConnectionStatus && <SystemStatusIndicator status={systemStatus} lastSyncedAt={lastSyncedAt} />}
            {showInBar && (
              <a
                href="mailto:info@vantagfleet.com"
                className="shrink-0 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-bold text-sm hover:bg-cyber-amber/90 transition-colors no-underline hidden sm:inline-flex"
              >
                Contact Sales
              </a>
            )}
            <Link
              href="/login"
              className="glass-btn min-h-[44px] inline-flex items-center px-3 sm:px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base text-soft-cloud hover:text-soft-cloud transition-colors touch-manipulation whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href={signupHref}
              className="glass-btn min-h-[44px] inline-flex items-center px-3 sm:px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base text-soft-cloud border-cyber-amber/30 hover:border-cyber-amber/50 hover:shadow-[0_0_20px_-4px_rgba(255,176,0,0.25)] transition-all touch-manipulation whitespace-nowrap"
            >
              {signupLabel}
            </Link>
          </>
        )}
        {ready && auth && (
          <>
            {isVantagControlUser && (
              <Link
                href="/admin/control-center"
                className={
                  pathname.startsWith('/admin/control-center') ? linkActive : linkBase
                }
              >
                Vantag Control
              </Link>
            )}
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
            {showConnectionStatus &&
              (isBrokerAccount ? (
                <SystemStatusIndicator variant="network" status="live" />
              ) : (
                <SystemStatusIndicator status={systemStatus} lastSyncedAt={lastSyncedAt} />
              ))}
            {showInBar && (
              <a
                href="mailto:info@vantagfleet.com"
                className="shrink-0 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-bold text-sm hover:bg-cyber-amber/90 transition-colors no-underline hidden sm:inline-flex"
              >
                Contact Sales
              </a>
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
      </div>
    </header>
  );
}

/** `useSearchParams` requires a Suspense boundary (Next.js App Router). */
export function Navbar(props: {
  isAuthenticated?: boolean;
  signupHref?: string;
  signupLabel?: string;
  topOffsetPx?: number;
  showAnnouncementInBar?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <header
          className="fixed left-0 right-0 z-[100] flex h-20 min-w-0 max-w-[100vw] items-center justify-between border-b border-white/10 bg-midnight-ink/95 px-3 backdrop-blur-md"
          style={{
            top: props.topOffsetPx ?? 0,
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
          }}
          aria-hidden
        >
          <span className="h-10 w-40 rounded-lg bg-white/5 animate-pulse" />
          <span className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" />
        </header>
      }
    >
      <NavbarInner {...props} />
    </Suspense>
  );
}
