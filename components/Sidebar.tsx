'use client';

import { useState, useEffect, useRef } from 'react';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { Logo } from '@/components/Logo';
import type { Organization } from '@/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
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
  BarChart3,
  Headphones,
  FileStack,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/loads', label: 'Loads', icon: DollarSign },
  { href: '/compliance', label: 'Compliance', icon: FileCheck },
  { href: '/documents', label: 'New Hire Documents', icon: FileStack },
  { href: '/regulatory', label: 'Regulatory', icon: ShieldCheck },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/roadside-mode', label: 'Roadside', icon: Smartphone },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  organizations,
  currentOrgId,
  showAdminLink = false,
  showAdminGearInTauri = false,
}: {
  organizations: Organization[];
  currentOrgId: string | null;
  showAdminLink?: boolean;
  showAdminGearInTauri?: boolean;
}) {
  const pathname = usePathname();
  const [isTauri, setIsTauri] = useState(false);
  const [adminGearOpen, setAdminGearOpen] = useState(false);
  const adminGearRef = useRef<HTMLDivElement>(null);

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
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-midnight-ink/80 backdrop-blur-md flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo size={32} />
          <span className="flex items-baseline gap-1 tracking-[0.2em]">
            <span className="font-bold text-cyber-amber text-base">VANTAG</span>
            <span className="font-light text-electric-teal text-base">FLEET</span>
          </span>
        </Link>
        <p className="text-xs text-soft-cloud/60 mt-0.5 ml-11">Compliance</p>
      </div>
      <div className="p-3 border-b border-border">
        <p className="text-xs font-medium text-soft-cloud/50 uppercase tracking-wider mb-2">
          Organization
        </p>
        <OrgSwitcher
          organizations={organizations}
          currentOrgId={currentOrgId}
        />
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-electric-teal/20 text-electric-teal'
                  : 'text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60'
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {showAdminLink && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-2 pt-2 border-t border-border ${
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
      <div className="p-3 border-t border-border space-y-0.5">
        {showAdminGearInTauri && isTauri && (
          <div className="relative" ref={adminGearRef}>
            <button
              type="button"
              onClick={() => setAdminGearOpen((o) => !o)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
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
                    onClick={() => setAdminGearOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-soft-cloud/90 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    <BarChart3 className="size-4 text-amber-400" />
                    Revenue
                  </Link>
                  <Link
                    href="/admin/support"
                    onClick={() => setAdminGearOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-soft-cloud/90 hover:bg-amber-500/10 hover:text-amber-400 border-t border-white/5"
                  >
                    <Headphones className="size-4 text-amber-400" />
                    Support
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-soft-cloud/70 hover:text-soft-cloud hover:bg-midnight-ink/60"
        >
          <LogOut className="size-5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
