'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, LayoutDashboard, Menu } from 'lucide-react';

export function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/';
  }

  return (
    <header className="md:relative fixed top-0 left-0 right-0 z-30 shrink-0 border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between bg-midnight-ink/95 md:bg-midnight-ink/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-4 min-h-[44px]">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2.5 rounded-lg text-soft-cloud hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
        )}
        <span className="text-sm text-soft-cloud/60 hidden sm:inline">Admin Portal</span>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyber-amber hover:text-cyber-amber/90 transition-colors py-2"
        >
          <LayoutDashboard className="size-4 shrink-0" />
          <span className="hidden sm:inline">Main dashboard</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/20 text-soft-cloud/80 text-sm font-medium hover:bg-white/5 hover:text-soft-cloud transition-colors min-h-[44px]"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </header>
  );
}
