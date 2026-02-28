'use client';

import { OrgSwitcher } from '@/components/OrgSwitcher';
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/compliance', label: 'Compliance', icon: FileCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  organizations,
  currentOrgId,
}: {
  organizations: Organization[];
  currentOrgId: string | null;
}) {
  const pathname = usePathname();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-700/80 bg-slate-900/95 flex flex-col">
      <div className="p-4 border-b border-slate-700/80">
        <Link href="/dashboard" className="block text-lg font-semibold text-white">
          Vantag Fleet
        </Link>
        <p className="text-xs text-slate-400 mt-0.5">Compliance</p>
      </div>
      <div className="p-3 border-b border-slate-700/80">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
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
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-700/80">
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
        >
          <LogOut className="size-5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
