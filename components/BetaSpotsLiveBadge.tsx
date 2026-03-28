'use client';

import Link from 'next/link';
import { useBetaSpotsLive } from '@/lib/useBetaSpotsLive';
import { FOUNDER_ENTERPRISE_DAYS, POST_BETA_ENTERPRISE_TRIAL_DAYS } from '@/lib/beta-config';

/** Signup / marketing: live count of founder beta slots (max 5). */
export function BetaSpotsLiveBadge() {
  const { remaining, cap } = useBetaSpotsLive(true);

  if (remaining === null) {
    return (
      <div
        className="mt-2 mx-auto h-8 max-w-[220px] rounded-full bg-white/5 animate-pulse"
        aria-hidden
      />
    );
  }

  if (remaining <= 0) {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm font-medium text-slate-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1.5">
          All {cap} founder spots claimed
        </p>
        <p className="text-xs text-cyber-amber/90">
          <Link href="/pricing" className="font-semibold underline underline-offset-2 hover:no-underline">
            {POST_BETA_ENTERPRISE_TRIAL_DAYS}-day Enterprise trial — no card required →
          </Link>
        </p>
        <p className="text-[11px] text-soft-cloud/55 max-w-[280px] mx-auto">
          Unlocks once all {cap} founder spots are claimed (signup here never asks for a card).
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2 text-center">
      <p className="text-sm font-medium text-cyber-amber/90 bg-cyber-amber/10 border border-cyber-amber/30 rounded-full px-3 py-1.5">
        <span className="tabular-nums font-bold text-cyber-amber">{remaining}</span> of {cap} founder spots left
        <span className="text-cyber-amber/70 font-normal"> · live</span>
      </p>
      <p className="text-[11px] text-soft-cloud/65 leading-snug max-w-xs mx-auto">
        Snag a slot for <span className="text-cyber-amber/90 font-semibold">{FOUNDER_ENTERPRISE_DAYS} days of Enterprise-level access</span>
        — <span className="text-soft-cloud/80">no credit card to sign up</span>.
      </p>
    </div>
  );
}
