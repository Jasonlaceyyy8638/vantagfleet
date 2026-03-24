'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles, X, Zap } from 'lucide-react';
import { useBetaSpotsLive } from '@/lib/useBetaSpotsLive';
import { POST_BETA_ENTERPRISE_TRIAL_DAYS } from '@/lib/beta-config';

type Billing = 'monthly' | 'yearly';

const SOLO_PRO_POINTS = [
  'Owner Operators',
  'AI Receipt Scanning',
  'Roadside Shield & Doc Locker',
  'Expiry Alerts',
];

const SOLO_PRO_EXCLUDED = ['ELD Integration: Not included'];

const FLEET_MASTER_POINTS = [
  'Small Fleets (2–5 trucks)',
  'Universal ELD Integration (Motive, Geotab, Samsara)',
  'Automated IFTA Reporting',
  'One-Click Audit-Ready PDF Exports',
  'Real-time Profitability',
  'Everything in Solo Pro',
];

const ENTERPRISE_POINTS = [
  'Unlimited Trucks',
  'Multi-user access',
  'Universal ELD Integration (Motive, Geotab, Samsara)',
  'Automated IFTA Reporting',
  'One-Click Audit-Ready PDF Exports',
  'Audit-Ready IFTA Reports',
  'Everything in Fleet Master',
  'Dedicated support',
];

export function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { remaining: betaSpotsRemaining, cap: betaCap } = useBetaSpotsLive(true);

  const showFounderBadge = betaSpotsRemaining != null && betaSpotsRemaining > 0;
  const betaFull = betaSpotsRemaining !== null && betaSpotsRemaining === 0;

  const handleCheckout = async (
    tierId: 'solo_pro' | 'fleet_master' | 'enterprise',
    options?: { postBetaEnterpriseTrial?: boolean }
  ) => {
    setLoadingTier(tierId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          billing: billing === 'yearly' ? 'annual' : 'monthly',
          ...(options?.postBetaEnterpriseTrial && { post_beta_enterprise_trial: true }),
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Monthly / Yearly toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-soft-cloud' : 'text-soft-cloud/60'}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billing === 'yearly'}
          onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
          className="relative w-12 h-6 rounded-full bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyber-amber/50"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cyber-amber transition-transform ${
              billing === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-soft-cloud' : 'text-soft-cloud/60'}`}>
          Yearly
        </span>
        {billing === 'yearly' && (
          <span className="ml-2 px-2 py-0.5 rounded bg-electric-teal/20 text-electric-teal text-xs font-semibold">
            Save 2 Months!
          </span>
        )}
      </div>

      {betaFull && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative mb-10 overflow-hidden rounded-2xl border-2 border-cyber-amber/60 bg-gradient-to-br from-cyber-amber/30 via-midnight-ink to-violet-900/30 p-6 sm:p-8 shadow-[0_0_50px_-10px_rgba(255,176,0,0.45)]"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'linear-gradient(110deg, transparent 40%, rgba(255,176,0,0.25) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-12 top-0 size-48 rounded-full bg-cyber-amber/25 blur-3xl"
            aria-hidden
          />
          <div className="relative text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-cyber-amber/50 bg-midnight-ink/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyber-amber">
              <Sparkles className="size-4" aria-hidden />
              Limited unlock
              <Zap className="size-4" aria-hidden />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Founder beta is full — get{' '}
              <span className="text-cyber-amber">{POST_BETA_ENTERPRISE_TRIAL_DAYS} days of Enterprise free</span>
            </h2>
            <p className="text-lg text-emerald-300 font-semibold">No credit card required to start</p>
            <p className="text-sm text-soft-cloud/80">
              Same Enterprise stack: live map, dispatchers, compliance at scale. Checkout skips the card until your trial ends — then you choose monthly or annual billing below.
            </p>
            <button
              type="button"
              onClick={() => handleCheckout('enterprise', { postBetaEnterpriseTrial: true })}
              disabled={!!loadingTier}
              className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-cyber-amber px-8 py-3.5 text-midnight-ink font-bold text-base hover:bg-cyber-amber/90 disabled:opacity-60 shadow-[0_0_30px_-6px_rgba(255,176,0,0.6)]"
            >
              {loadingTier === 'enterprise' ? <Loader2 className="size-5 animate-spin" /> : null}
              {loadingTier === 'enterprise'
                ? 'Opening secure checkout…'
                : `Start ${POST_BETA_ENTERPRISE_TRIAL_DAYS}-day Enterprise trial — no card`}
            </button>
            <p className="text-xs text-soft-cloud/50">
              Uses {billing === 'yearly' ? 'annual' : 'monthly'} Enterprise pricing after trial when you add payment.
            </p>
          </div>
        </motion.div>
      )}

      {/* Three tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Solo Pro */}
        <div className="rounded-2xl border border-white/10 bg-midnight-ink p-6 flex flex-col">
          <h3 className="text-xl font-bold text-soft-cloud">Solo Pro</h3>
          <div className="mt-4 flex items-baseline gap-1 flex-wrap">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'yearly' ? '$290' : '$29'}
            </span>
            <span className="text-soft-cloud/70 text-lg">
              {billing === 'yearly' ? '/ yr' : '/ mo'}
            </span>
          </div>
          <p className="mt-1 text-xs text-soft-cloud/60">
            {billing === 'yearly' ? 'Billed annually · Save 2 months' : 'or $290/year'}
          </p>
          <ul className="mt-6 space-y-3 flex-1 text-sm text-soft-cloud/90">
            {SOLO_PRO_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
            {SOLO_PRO_EXCLUDED.map((point, i) => (
              <li key={`excluded-${i}`} className="flex items-start gap-2 text-soft-cloud/60">
                <X className="size-4 text-red-400 shrink-0 mt-0.5" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => handleCheckout('solo_pro')}
            disabled={!!loadingTier}
            className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'solo_pro' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>

        {/* Fleet Master — Most Popular */}
        <div className="rounded-2xl border-2 border-cyber-amber/50 bg-cyber-amber/5 p-6 flex flex-col relative shadow-[0_0_40px_-12px_rgba(255,176,0,0.2)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyber-amber text-midnight-ink text-xs font-bold uppercase tracking-wide">
            Most Popular
          </div>
          {showFounderBadge && (
            <div className="mt-4 mb-1 space-y-1">
              <div className="px-3 py-1.5 rounded-lg bg-cyber-amber/20 border border-cyber-amber/40 text-cyber-amber text-xs font-semibold text-center">
                🎁 FOUNDER DEAL: Get this for $159/mo for life!
              </div>
              <p className="text-center text-[11px] font-medium text-soft-cloud/70 tabular-nums">
                <span className="text-cyber-amber font-bold">{betaSpotsRemaining}</span> of {betaCap} founder spots left · live
              </p>
            </div>
          )}
          <h3 className="text-xl font-bold text-soft-cloud mt-2">Fleet Master</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'yearly' ? '$1,990' : '$199'}
            </span>
            <span className="text-soft-cloud/60 text-lg">
              {billing === 'yearly' ? '/ yr' : '/ mo'}
            </span>
          </div>
          <p className="mt-1 text-xs text-soft-cloud/70">
            {billing === 'yearly' ? 'Billed annually · Save 2 months' : 'or $1,990/year'}
          </p>
          <ul className="mt-6 space-y-3 flex-1 text-sm text-soft-cloud/90">
            {FLEET_MASTER_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => handleCheckout('fleet_master')}
            disabled={!!loadingTier}
            className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'fleet_master' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>

        {/* Enterprise */}
        <div
          className={`rounded-2xl border bg-midnight-ink p-6 flex flex-col ${
            betaFull ? 'border-cyber-amber/50 ring-1 ring-cyber-amber/30 shadow-[0_0_24px_-8px_rgba(255,176,0,0.35)]' : 'border-white/10'
          }`}
        >
          {betaFull && (
            <div className="mb-3 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-center text-xs font-bold text-emerald-300">
              {POST_BETA_ENTERPRISE_TRIAL_DAYS}-DAY TRIAL · NO CARD TO START
            </div>
          )}
          <h3 className="text-xl font-bold text-soft-cloud">Enterprise</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'yearly' ? '$3,990' : '$399'}
            </span>
            <span className="text-soft-cloud/70 text-lg">
              {billing === 'yearly' ? '/ yr' : '/ mo'}
            </span>
          </div>
          <p className="mt-1 text-xs text-soft-cloud/60">
            {billing === 'yearly' ? 'Billed annually · Save 2 months' : 'or $3,990/year'}
          </p>
          <ul className="mt-6 space-y-3 flex-1 text-sm text-soft-cloud/90">
            {ENTERPRISE_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              handleCheckout('enterprise', betaFull ? { postBetaEnterpriseTrial: true } : undefined)
            }
            disabled={!!loadingTier}
            className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'enterprise' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : betaFull ? (
              `Start ${POST_BETA_ENTERPRISE_TRIAL_DAYS}-day trial — no card`
            ) : (
              'Get started'
            )}
          </button>
        </div>
      </div>

      {/* Add-ons Section — IFTA is standard on Fleet Master & Enterprise */}
      <section className="border-t border-white/10 pt-12">
        <h2 className="text-lg font-bold text-soft-cloud text-center mb-8">Add-ons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col items-center text-center">
            <p className="font-bold text-soft-cloud">BOC-3 Filing</p>
            <p className="text-2xl font-bold text-cyber-amber mt-1">$79</p>
            <p className="text-xs text-soft-cloud/60 mt-0.5">One-time</p>
            <Link
              href="/contact"
              className="mt-4 w-full py-2.5 rounded-lg border border-cyber-amber/50 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/10 flex items-center justify-center"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col items-center text-center">
            <p className="font-bold text-soft-cloud">Biennial Updates</p>
            <p className="text-2xl font-bold text-cyber-amber mt-1">$99</p>
            <Link
              href="/contact"
              className="mt-4 w-full py-2.5 rounded-lg border border-cyber-amber/50 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/10 flex items-center justify-center"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
