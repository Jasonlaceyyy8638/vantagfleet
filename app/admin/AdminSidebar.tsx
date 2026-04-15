'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Headphones,
  Building2,
  LayoutDashboard,
  UserCog,
  DollarSign,
  Route,
  MessageCircle,
  Home,
  X,
  Truck,
} from 'lucide-react';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/support', label: 'Customer Support', icon: Headphones },
  { href: '/admin/support/chat', label: 'Live Chat', icon: MessageCircle },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/compliance', label: 'Fuel & mileage', icon: Route },
  { href: '/admin/setup', label: 'Organization Setup', icon: Building2 },
  { href: '/admin/team', label: 'Team', icon: UserCog },
];

export function AdminSidebar({
  role,
  mobileOpen = false,
  onClose,
}: {
  role: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="p-4 border-b border-white/10">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-2 font-semibold text-cyber-amber"
        >
          <Truck className="size-5" />
          VantagFleet TMS
        </Link>
        <p className="text-xs text-soft-cloud/50 mt-1">Staff operations console</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
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
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] md:min-h-0 ${
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
      <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-soft-cloud/70 hover:text-soft-cloud px-3 py-2.5 rounded-lg hover:bg-white/5 min-h-[44px] md:min-h-0"
        >
          <Home className="size-4" />
          Home
        </Link>
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-soft-cloud/70 hover:text-soft-cloud px-3 py-2.5 rounded-lg hover:bg-white/5 min-h-[44px] md:min-h-0"
        >
          <LayoutDashboard className="size-4" />
          Back to Overview
        </Link>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-soft-cloud/70 hover:text-soft-cloud px-3 py-2.5 rounded-lg hover:bg-white/5 min-h-[44px] md:min-h-0"
        >
          <LayoutDashboard className="size-4" />
          Carrier dashboard
        </Link>
        <p className="text-xs text-soft-cloud/50 mt-2 px-3 uppercase tracking-wider">
          {role}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
          <div className="relative w-72 max-w-[85vw] bg-midnight-ink border-r border-white/10 flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-white/10 shrink-0">
              <span className="font-semibold text-soft-cloud">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-lg text-soft-cloud hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              {navContent}
            </div>
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/10 bg-midnight-ink flex-col">
        {navContent}
      </aside>
    </>
  );
}
