import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canAccessVantagControlAdmin } from '@/lib/admin/control-access';

export const metadata: Metadata = {
  title: 'Vantag Control | VantagFleet',
  description: 'Internal operations console for VantagFleet TMS.',
};

const NAV = [
  { href: '/admin/control-center', label: 'Dashboard' },
  { href: '/admin/control-center/announcements', label: 'Announcements' },
  { href: '/admin/control-center/resources', label: 'Resources' },
  { href: '/admin/control-center/customers', label: 'Customers' },
  { href: '/admin/control-center/audit', label: 'Audit log' },
] as const;

export default async function VantagControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!canAccessVantagControlAdmin(user.email)) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-500/95">
              Vantag Control
            </p>
            <p className="text-sm font-medium text-zinc-200">VantagFleet — internal operations</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="ml-1 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-amber-400/95 transition hover:border-amber-500/50 hover:bg-amber-500/10"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
