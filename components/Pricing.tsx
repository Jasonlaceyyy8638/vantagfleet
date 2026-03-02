'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sparkles } from 'lucide-react';

function trialEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const SOLO_FEATURES = [
  'Mobile **Roadside Shield** for 1 Driver',
  '**Digital document locker**',
  '**SMS expiry alerts**',
];

const PRO_FEATURES = [
  'Everything in Solo Guard for **up to 10 trucks**',
  '**Unlimited AI Document Scanning** (Med Cards, CDLs, COIs)',
  '**Samsara & Motive ELD Integration** (Auto-sync HOS and Miles)',
  '**Carrier Hiring Portal** (Onboard drivers in 2 minutes)',
];

const FLEET_FEATURES = [
  'For fleets **10+**',
  '**Quarterly IFTA Prep Automation**',
  '**Full Federal Authority Management** (BOC-3, MCS-150)',
];

const ADDONS = [
  { name: 'BOC-3 Filing', price: '$79', tag: 'Join Waitlist', comingSoon: true },
  { name: 'Biennial Updates', price: '$99', tag: 'Join Waitlist', comingSoon: true },
  { name: 'IFTA Prep', price: '$49/qtr', tag: 'Join Waitlist', comingSoon: true },
];

function FeatureText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold text-soft-cloud">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const cancelBeforeDate = useMemo(() => trialEndDate(), []);

  const handleCheckout = async (tierId: 'starter' | 'pro') => {
    setLoadingTier(tierId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error);
    } finally {
      setLoadingTier(null);
    }
  };

  const soloPrice = billing === 'annual' ? '$99/year' : '$15/mo';
  const soloSubtext = billing === 'annual' ? '$15/mo billed annually' : 'or $99/year if paid annually';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Monthly / Annual toggle */}
      <div className="flex justify-center gap-2 mb-12">
        <button
          type="button"
          onClick={() => setBilling('monthly')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            billing === 'monthly'
              ? 'bg-cyber-amber text-midnight-ink'
              : 'bg-white/5 text-soft-cloud/70 hover:text-soft-cloud border border-white/10'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling('annual')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            billing === 'annual'
              ? 'bg-cyber-amber text-midnight-ink'
              : 'bg-white/5 text-soft-cloud/70 hover:text-soft-cloud border border-white/10'
          }`}
        >
          Annual
        </button>
      </div>

      {/* 3-column tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Tier 1: Solo Guard */}
        <div className="rounded-2xl border border-white/10 bg-midnight-ink p-6 flex flex-col">
          <h3 className="text-xl font-bold text-soft-cloud">Solo Guard</h3>
          <div className="mt-4 flex items-baseline gap-1 flex-wrap">
            <span className="text-3xl font-bold text-cyber-amber">{soloPrice}</span>
          </div>
          <p className="mt-1 text-xs text-soft-cloud/60">{soloSubtext}</p>
          <ul className="mt-6 space-y-3 flex-1">
            {SOLO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-soft-cloud/90">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <FeatureText text={f} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => handleCheckout('starter')}
            disabled={!!loadingTier}
            className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'starter' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>

        {/* Tier 2: Compliance Pro — MOST POPULAR */}
        <div className="rounded-2xl border-2 border-cyber-amber/50 bg-cyber-amber/5 p-6 flex flex-col relative shadow-[0_0_40px_-12px_rgba(255,176,0,0.2)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyber-amber text-midnight-ink text-xs font-bold uppercase tracking-wide">
            Most Popular
          </div>
          <h3 className="text-xl font-bold text-soft-cloud mt-2">Compliance Pro</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">$199</span>
            <span className="text-soft-cloud/60">/mo</span>
          </div>
          <p className="mt-2 text-xs text-soft-cloud/70">
            30 days free, then $199/mo. Cancel anytime before {cancelBeforeDate}.
          </p>
          <ul className="mt-6 space-y-3 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-soft-cloud/90">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <FeatureText text={f} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => handleCheckout('pro')}
            disabled={!!loadingTier}
            className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'pro' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>

        {/* Tier 3: Fleet Command — Custom */}
        <div className="rounded-2xl border border-white/10 bg-midnight-ink p-6 flex flex-col">
          <h3 className="text-xl font-bold text-soft-cloud">Fleet Command</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-cyber-amber">Custom</span>
          </div>
          <p className="mt-1 text-sm text-soft-cloud/60">Contact us for pricing</p>
          <ul className="mt-6 space-y-3 flex-1">
            {FLEET_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-soft-cloud/90">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <FeatureText text={f} />
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-6 w-full py-3 rounded-xl border-2 border-cyber-amber/50 text-cyber-amber font-bold hover:bg-cyber-amber/10 flex items-center justify-center gap-2 transition-colors text-center"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* Add-on section: Compliance On-Demand */}
      <section className="border-t border-white/10 pt-12">
        <h2 className="text-lg font-bold text-soft-cloud text-center mb-2">
          Compliance On-Demand
        </h2>
        <p className="text-soft-cloud/60 text-sm text-center mb-8">
          Add-on services — join the waitlist for early access
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ADDONS.map((addon) => (
            <div
              key={addon.name}
              className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col items-center text-center"
            >
              <p className="font-bold text-soft-cloud">{addon.name}</p>
              <p className="text-2xl font-bold text-cyber-amber mt-1">{addon.price}</p>
              <Link
                href="/contact"
                className="mt-4 w-full py-2.5 rounded-lg border border-cyber-amber/50 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/10 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="size-4" />
                {addon.tag}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
