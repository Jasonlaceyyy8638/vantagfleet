'use client';

import { useState, useEffect, useRef } from 'react';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { Logo } from '@/components/Logo';
import type { Organization } from '@/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  UserPlus,
  User,
  Truck,
  FileCheck,
  Settings,
  LogOut,
  Smartphone,
  DollarSign,
  ShieldCheck,
  Shield,
  Plug,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Headphones,
  FileStack,
  Upload,
  Fuel,
  Building2,
  MapPin,
  Lock,
  MessageCircle,
  Package,
  Menu,
  X,
  Handshake,
  Landmark,
  Store,
  Network,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EMAIL_SUPPORT, EMAIL_INFO } from '@/lib/email-addresses';
import { SupportTicketModal } from '@/components/SupportTicketModal';
import { useDemoMode } from '@/src/contexts/DemoModeContext';

/** Primary TMS workflow (load-centric). */
const navPrimary = [
  { href: '/dispatch', label: 'Dispatch Board', icon: LayoutGrid },
  { href: '/loads', label: 'Active Loads', icon: DollarSign },
  { href: '/customers', label: 'Customers', icon: Handshake },
  { href: '/settlements', label: 'Settlements', icon: Landmark },
];

const navCore = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/map', label: 'Live Map', icon: MapPin },
  { href: '/dashboard/enterprise', label: 'Enterprise Overview', icon: Building2 },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Truck },
];

const safetyAdminNav = [
  { href: '/compliance', label: 'Compliance', icon: FileCheck },
  { href: '/dashboard/ifta', label: 'IFTA', icon: Fuel },
  { href: '/documents', label: 'New Hire Documents', icon: FileStack },
];

const navTail = [
  { href: '/regulatory', label: 'Regulatory', icon: ShieldCheck },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/roadside-mode', label: 'Roadside', icon: Smartphone },
  { href: '/trailers', label: 'Trailers', icon: Package },
  { href: '/dashboard/feedback', label: 'Beta Feedback', icon: Headphones },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/settings/team', label: 'Team', icon: UserPlus },
];

/** Dispatcher: TMS-first, then map and fleet tools; Safety & Admin included. */
const dispatcherNavPrimary = [
  { href: '/dispatch', label: 'Dispatch Board', icon: LayoutGrid },
  { href: '/loads', label: 'Active Loads', icon: DollarSign },
  { href: '/customers', label: 'Customers', icon: Handshake },
  { href: '/settlements', label: 'Settlements', icon: Landmark },
];

const dispatcherNavRest = [
  { href: '/dashboard/map', label: 'Live Map', icon: MapPin },
  { href: '/dashboard/enterprise', label: 'Fleet Health', icon: Building2 },
  { href: '/dashboard/ifta', label: 'IFTA', icon: Fuel },
  { href: '/roadside-mode', label: 'Roadside', icon: Smartphone },
  { href: '/trailers', label: 'Trailers', icon: Package },
  { href: '/dashboard/feedback', label: 'Message Center', icon: MessageCircle },
];

const dispatcherNav = [...dispatcherNavPrimary, ...dispatcherNavRest];

const navMain = [...navPrimary, ...navCore];

/** Broker / 3PL: book of business — no fleet garage items in primary nav. */
const brokerNavPrimary = [
  { href: '/dispatch', label: 'Dispatch Board', icon: LayoutGrid },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: Store },
  { href: '/loads', label: 'Active Loads', icon: DollarSign },
  { href: '/dashboard/network', label: 'Network (Vetted Carriers)', icon: Network },
  { href: '/dashboard/margin', label: 'Margin Analytics', icon: BarChart3 },
  { href: '/customers', label: 'Customers', icon: Handshake },
  { href: '/settlements', label: 'Settlements', icon: Landmark },
];

const brokerNavCore = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/map', label: 'Live Map', icon: MapPin },
  { href: '/dashboard/enterprise', label: 'Enterprise Overview', icon: Building2 },
];

const brokerNavMain = [...brokerNavPrimary, ...brokerNavCore];

/** Drivers see only these; no Dispatch, no Trailers. */
const driverNav = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/documents', label: 'My Uploads', icon: Upload },
  { href: '/driver/roadside-shield', label: 'Roadside', icon: Smartphone },
];

/** Profile link for non-driver nav (dispatcher / full nav). */
const profileNavItem = { href: '/profile', label: 'Profile', icon: User };

export function Sidebar({
  organizations,
  currentOrgId,
  showAdminLink = false,
  showAdminGearInTauri = false,
  isDriverOnly = false,
  isDispatcher = false,
  showBetaRibbon = false,
  canSeeMap = true,
  isFounder = false,
  fullName = null,
  isDemoGuest = false,
  isBrokerOrg = false,
}: {
  organizations: Organization[];
  currentOrgId: string | null;
  showAdminLink?: boolean;
  showAdminGearInTauri?: boolean;
  isDriverOnly?: boolean;
  isDispatcher?: boolean;
  showBetaRibbon?: boolean;
  canSeeMap?: boolean;
  isFounder?: boolean;
  fullName?: string | null;
  /** Unauthenticated sandbox: exit clears demo cookie and returns home. */
  isDemoGuest?: boolean;
  /** Logged-in org is a freight broker (not asset carrier). */
  isBrokerOrg?: boolean;
}) {
  const pathname = usePathname();
  const { isDemoMode, demoRole } = useDemoMode();
  const sandboxHref = (href: string) => {
    if (!isDemoMode) return href;
    return href.includes('?') ? `${href}&mode=demo&role=${demoRole}` : `${href}?mode=demo&role=${demoRole}`;
  };
  const [isTauri, setIsTauri] = useState(false);
  const [adminGearOpen, setAdminGearOpen] = useState(false);
  const [supportTicketOpen, setSupportTicketOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [safetyAdminOpen, setSafetyAdminOpen] = useState(isDemoGuest);
  const adminGearRef = useRef<HTMLDivElement>(null);

  const closeMobile = () => setMobileOpen(false);

  const isBrokerNav = isBrokerOrg || (isDemoMode && demoRole === 'broker');
  const safetyNavItems = isBrokerNav
    ? safetyAdminNav.filter((item) => item.href !== '/dashboard/ifta')
    : safetyAdminNav;
  const navTailFiltered = isBrokerNav ? navTail.filter((item) => item.href !== '/trailers') : navTail;

  const isSafetySectionActive = safetyNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  useEffect(() => {
    if (isSafetySectionActive) setSafetyAdminOpen(true);
  }, [isSafetySectionActive]);

  const topNav = isBrokerNav
    ? brokerNavMain
    : isDispatcher
      ? dispatcherNav
      : navMain;
  const showMapLock = !canSeeMap;

  useEffect(() => {
    if (!adminGearOpen) return;
    const close = (e: MouseEvent) => {
      if (adminGearRef.current && !adminGearRef.current.contains(e.target as Node)) {
        setAdminGearOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [adminGearOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown };
    if (w.__TAURI__ || w.__TAURI_INTERNAL__) {
      setIsTauri(true);
      return;
    }
    if (sessionStorage.getItem('tauri') === '1') setIsTauri(true);
  }, []);

  const signOut = async () => {
    if (isDemoGuest) {
      document.cookie = 'vf_demo=; path=/; max-age=0';
      document.cookie = 'vf_demo_role=; path=/; max-age=0';
      window.location.href = '/';
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const onNav = () => mobileOpen && closeMobile();

  const sidebarContent = (
    <>
      {showBetaRibbon && (
        <div className="absolute top-0 right-0 z-10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-midnight-ink bg-cyber-amber/90 rounded-bl-md shadow-sm">
          BETA ACCESS
        </div>
      )}
      <div className="p-4 border-b border-border">
        <Link href={sandboxHref('/dashboard')} onClick={onNav} className="flex items-center gap-3">
          <Logo size={32} />
          <span className="flex items-baseline gap-1 tracking-[0.2em]">
            <span className="font-bold text-cyber-amber text-base">VANTAG</span>
            <span className="font-light text-electric-teal text-base">FLEET</span>
          </span>
        </Link>
        <p className="text-xs text-soft-cloud/60 mt-0.5 ml-11">TMS</p>
        {fullName && (
          <p className="text-sm text-soft-cloud/80 mt-2 ml-11">Welcome back, {fullName}</p>
        )}
      </div>
      {!isDriverOnly && (
        <div className="p-3 border-b border-border">
          <p className="text-xs font-medium text-soft-cloud/50 uppercase tracking-wider mb-2">
            Organization
          </p>
          <OrgSwitcher
            organizations={organizations}
            currentOrgId={currentOrgId}
            isFounder={isFounder}
          />
        </div>
      )}
      {!isDriverOnly && <GlobalSearchBar mode={isBrokerNav ? 'broker' : 'carrier'} />}
      <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
        {(isDriverOnly ? driverNav : [profileNavItem, ...topNav]).map((item) => {
          const isActive = pathname === item.href || (item.href.startsWith('/dashboard#') && pathname === '/dashboard');
          const Icon = item.icon;
          const isMapLink = item.href === '/dashboard/map';
          const showLock = isMapLink && showMapLock;
          const joyrideId =
            item.href === '/dispatch'
              ? 'demo-joyride-dispatch'
              : item.href === '/settlements'
                ? 'demo-joyride-accounting'
                : undefined;
          return (
            <Link
              key={item.href}
              id={joyrideId}
              href={sandboxHref(item.href)}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] md:min-h-0 ${
                isActive
                  ? 'bg-electric-teal/20 text-electric-teal'
                  : 'text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60'
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
              {showLock && <Lock className="size-4 shrink-0 text-cyber-amber/80 ml-auto" aria-label="Upgrade to unlock" />}
            </Link>
          );
        })}
        {!isDriverOnly && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setSafetyAdminOpen((o) => !o)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] md:min-h-0 text-left ${
                isSafetySectionActive
                  ? 'bg-midnight-ink/80 text-electric-teal/90'
                  : 'text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60'
              }`}
              aria-expanded={safetyAdminOpen}
            >
              <ShieldCheck className="size-5 shrink-0 opacity-80" />
              <span className="flex-1">Safety &amp; Admin</span>
              <ChevronDown className={`size-4 shrink-0 transition-transform ${safetyAdminOpen ? 'rotate-180' : ''}`} />
            </button>
            {safetyAdminOpen && (
              <div className="ml-2 pl-2 border-l border-white/10 space-y-0.5 mt-0.5">
                {safetyNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      id={item.href === '/compliance' ? 'demo-joyride-compliance' : undefined}
                      href={sandboxHref(item.href)}
                      onClick={onNav}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] md:min-h-0 ${
                        isActive
                          ? 'bg-electric-teal/20 text-electric-teal'
                          : 'text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60'
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {!isDriverOnly && (!isDispatcher || isBrokerNav) &&
          navTailFiltered.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const isMapLink = item.href === '/dashboard/map';
            const showLock = isMapLink && showMapLock;
            return (
              <Link
                key={item.href}
                href={sandboxHref(item.href)}
                onClick={onNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] md:min-h-0 ${
                  isActive
                    ? 'bg-electric-teal/20 text-electric-teal'
                    : 'text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60'
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
                {showLock && <Lock className="size-4 shrink-0 text-cyber-amber/80 ml-auto" aria-label="Upgrade to unlock" />}
              </Link>
            );
          })}
        {showAdminLink && (
          <Link
            href="/admin"
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 pt-2 border-t border-border min-h-[44px] md:min-h-0 ${
              pathname.startsWith('/admin')
                ? 'bg-cyber-amber/20 text-cyber-amber'
                : 'text-cyber-amber/90 hover:text-cyber-amber hover:bg-cyber-amber/10'
            }`}
          >
            <Shield className="size-5 shrink-0" />
            Admin
          </Link>
        )}
      </nav>
      <div className="p-3 border-t border-border space-y-0.5 shrink-0">
        {showAdminGearInTauri && isTauri && (
          <div className="relative" ref={adminGearRef}>
            <button
              type="button"
              onClick={() => setAdminGearOpen((o) => !o)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors min-h-[44px] md:min-h-0"
              aria-expanded={adminGearOpen}
              aria-haspopup="true"
            >
              <Settings className="size-5 shrink-0" />
              Admin
              <ChevronUp className={`size-4 ml-auto transition-transform ${adminGearOpen ? '' : 'rotate-180'}`} />
            </button>
            {adminGearOpen && (
              <>
                <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-amber-500/30 bg-midnight-ink shadow-xl overflow-hidden">
                  <Link
                    href="/admin/revenue"
                    onClick={() => { setAdminGearOpen(false); closeMobile(); }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-soft-cloud/90 hover:bg-amber-500/10 hover:text-amber-400 min-h-[44px]"
                  >
                    <BarChart3 className="size-4 text-amber-400" />
                    Revenue
                  </Link>
                  <Link
                    href="/admin/support"
                    onClick={() => { setAdminGearOpen(false); closeMobile(); }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-soft-cloud/90 hover:bg-amber-500/10 hover:text-amber-400 border-t border-white/5 min-h-[44px]"
                  >
                    <Headphones className="size-4 text-amber-400" />
                    Support
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex flex-col gap-0.5 text-xs text-soft-cloud/50">
          <button
            type="button"
            onClick={() => setSupportTicketOpen(true)}
            className="px-3 py-2.5 rounded-lg hover:text-cyber-amber hover:bg-midnight-ink/60 transition-colors text-left min-h-[44px] md:min-h-0"
          >
            Help
          </button>
          <a href={`mailto:${EMAIL_INFO}`} className="px-3 py-2.5 rounded-lg hover:text-cyber-amber hover:bg-midnight-ink/60 transition-colors min-h-[44px] md:min-h-0 inline-flex items-center">
            General Inquiries
          </a>
        </div>
        <SupportTicketModal open={supportTicketOpen} onClose={() => setSupportTicketOpen(false)} />
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60 min-h-[44px] md:min-h-0"
        >
          <LogOut className="size-5 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: fixed top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-midnight-ink/95 backdrop-blur-sm pt-safe">
        <Link href={sandboxHref('/dashboard')} className="flex items-center gap-2 min-h-[44px] items-center">
          <Logo size={28} />
          <span className="font-bold text-cyber-amber text-sm">VANTAG</span>
          <span className="text-electric-teal text-sm font-light">FLEET</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-lg text-soft-cloud hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </header>
      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal aria-label="Menu">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} aria-hidden />
          <div className="relative w-72 max-w-[85vw] bg-midnight-ink/98 backdrop-blur border-r border-border flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
              <span className="font-semibold text-soft-cloud">Menu</span>
              <button
                type="button"
                onClick={closeMobile}
                className="p-2.5 rounded-lg text-soft-cloud hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
      {/* Desktop: sidebar */}
      <aside
        id="tour-sidebar"
        className="hidden md:flex w-64 shrink-0 border-r border-border bg-midnight-ink/80 backdrop-blur-md flex flex-col relative"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
