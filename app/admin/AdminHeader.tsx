'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, LayoutDashboard } from 'lucide-react';

export function AdminHeader() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/';
  }

  return (
    <header className="shrink-0 border-b border-white/10 px-6 py-3 flex items-center justify-between bg-midnight-ink/80">
      <div className="flex items-center gap-4">
        <span className="text-sm text-soft-cloud/60">Admin Portal</span>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyber-amber hover:text-cyber-amber/90 transition-colors"
        >
          <LayoutDashboard className="size-4" />
          Main dashboard
        </Link>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-soft-cloud/80 text-sm font-medium hover:bg-white/5 hover:text-soft-cloud transition-colors"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </header>
  );
}
