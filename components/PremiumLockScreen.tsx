'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
};

export function PremiumLockScreen({ title, description, ctaLabel = 'Unlock with a plan' }: Props) {
  return (
    <div className="min-h-[60vh] bg-midnight-ink p-6 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-card p-8 text-center shadow-xl">
        <div className="mx-auto w-14 h-14 rounded-full bg-cyber-amber/20 flex items-center justify-center mb-4">
          <Lock className="size-8 text-cyber-amber" />
        </div>
        <h1 className="text-xl font-semibold text-soft-cloud mb-2">{title}</h1>
        <p className="text-soft-cloud/70 text-sm mb-6">{description}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
