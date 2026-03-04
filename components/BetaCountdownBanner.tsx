'use client';

import Link from 'next/link';

const MS_PER_DAY = 86400000;

type Props = {
  betaExpiresAt: string | null;
  isBetaTester: boolean;
};

function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = Date.now();
  const diff = expiry.getTime() - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

export function BetaCountdownBanner({ betaExpiresAt, isBetaTester }: Props) {
  if (!isBetaTester || !betaExpiresAt) return null;

  const daysRemaining = getDaysRemaining(betaExpiresAt);
  if (daysRemaining == null || daysRemaining <= 0) return null;

  const isWarningPhase = daysRemaining >= 1 && daysRemaining <= 29;
  const isActivePhase = daysRemaining >= 30 && daysRemaining <= 90;

  if (!isWarningPhase && !isActivePhase) return null;

  if (isWarningPhase) {
    return (
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-amber-200/95">
        <p className="text-sm font-medium">
          ⚠️ Your Beta Access expires in{' '}
          <span className="font-bold text-amber-300">{daysRemaining} day{daysRemaining === 1 ? '' : 's'}</span>.
          Secure your Lifetime 20% Discount before it&apos;s gone!
        </p>
        <Link
          href="/pricing"
          className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-midnight-ink hover:bg-amber-400 transition-colors"
        >
          Claim Lifetime Discount
        </Link>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-blue-200/90">
      <p className="text-sm font-medium">
        Beta Access Active: <span className="font-semibold text-blue-100">{daysRemaining} days</span> left. Enjoy full access!
      </p>
      <Link
        href="/pricing"
        className="shrink-0 rounded-lg border border-blue-400/50 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/30 transition-colors"
      >
        Claim Lifetime Discount
      </Link>
    </div>
  );
}
