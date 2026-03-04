'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  hasAccess: boolean;
  title?: string;
};

export function UpgradeOverlay({ children, hasAccess, title = 'Upgrade to Unlock' }: Props) {
  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[1px]">
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-midnight-ink/90 backdrop-blur-sm"
        aria-hidden={false}
      >
        <div className="mx-auto w-14 h-14 rounded-full bg-cyber-amber/20 flex items-center justify-center mb-4">
          <Lock className="size-8 text-cyber-amber" />
        </div>
        <p className="text-lg font-semibold text-soft-cloud mb-2">{title}</p>
        <p className="text-soft-cloud/70 text-sm mb-4 text-center max-w-xs">
          Subscribe or use beta access to use this feature.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors pointer-events-auto"
        >
          Upgrade to Unlock
        </Link>
      </div>
    </div>
  );
}
