'use client';

import Link from 'next/link';

const UPSELL_DAYS_MAX = 15; // last 15 days (75–90): show prominent upsell

type Props = {
  daysRemaining: number | null;
};

export function BetaExpirationBanner({ daysRemaining }: Props) {
  if (daysRemaining == null || daysRemaining < 0) return null;

  const isUpsellPhase = daysRemaining > 0 && daysRemaining <= UPSELL_DAYS_MAX;

  if (isUpsellPhase) {
    return (
      <div className="mb-6 rounded-xl border border-cyber-amber/50 bg-cyber-amber/15 px-4 py-4">
        <p className="text-soft-cloud font-medium">
          Your Beta Access ends in{' '}
          <span className="font-bold text-cyber-amber">{daysRemaining} day{daysRemaining === 1 ? '' : 's'}</span>.
          To keep your fleet and IFTA data active,{' '}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 font-semibold text-cyber-amber underline hover:no-underline"
          >
            click here to subscribe at our early-adopter rate
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 flex justify-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-soft-cloud/20 bg-soft-cloud/5 px-3 py-1.5 text-xs font-medium text-soft-cloud/80">
        Beta Access: {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining
      </span>
    </div>
  );
}
