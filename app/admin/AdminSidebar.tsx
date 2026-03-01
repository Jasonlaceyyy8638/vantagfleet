'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Headphones,
  RotateCcw,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  UserCog,
} from 'lucide-react';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: ShieldCheck },
  { href: '/admin/support', label: 'Customer Support', icon: Headphones },
  { href: '/admin/refunds', label: 'Refunds', icon: RotateCcw },
  { href: '/admin/setup', label: 'Organization Setup', icon: Building2 },
  { href: '/admin/team', label: 'Team', icon: UserCog },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-midnight-ink flex flex-col">
      <div className="p-4 border-b border-white/10">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-semibold text-cyber-amber"
        >
          <ShieldCheck className="size-5" />
          VantagFleet Admin
        </Link>
        <p className="text-xs text-soft-cloud/50 mt-1">Staff only</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {adminNav.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyber-amber/20 text-cyber-amber'
                  : 'text-soft-cloud/80 hover:text-soft-cloud hover:bg-cyber-amber/10'
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-soft-cloud/70 hover:text-soft-cloud px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <LayoutDashboard className="size-4" />
          ← Dashboard
        </Link>
        <p className="text-xs text-soft-cloud/50 mt-2 px-3 uppercase tracking-wider">
          {role}
        </p>
      </div>
    </aside>
  );
}
