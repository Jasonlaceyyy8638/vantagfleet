'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Mail } from 'lucide-react';

const SOLO_POINTS: { text: string; icon?: 'mail' }[] = [
  { text: 'Roadside Shield Mobile Folder' },
  { text: 'Digital Doc Locker' },
  { text: 'SendGrid Expiry Alerts', icon: 'mail' },
];

const PRO_POINTS = [
  'Everything in Solo',
  'Unlimited AI Smart-Scans',
  'Carrier Hiring Portal',
  'Samsara/Motive Sync',
  'Audit-Ready Dashboard',
];

export function Pricing() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (tierId: 'starter' | 'pro') => {
    setLoadingTier(tierId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          billing: tierId === 'starter' ? billing : undefined,
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
    <div className="max-w-5xl mx-auto">
      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Card 1: Solo Guard */}
        <div className="rounded-2xl border border-white/10 bg-midnight-ink p-6 flex flex-col">
          <h3 className="text-xl font-bold text-soft-cloud">Solo Guard</h3>
          <div className="mt-4 flex items-baseline gap-1 flex-wrap">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'annual' ? '$250' : '$29'}
            </span>
            <span className="text-soft-cloud/70 text-lg">
              {billing === 'annual' ? '/ year' : '/ mo'}
            </span>
          </div>
          <p className="mt-1 text-xs text-soft-cloud/60">
            {billing === 'annual' ? 'Billed annually · or $29/mo' : 'or $250/year'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                billing === 'annual'
                  ? 'bg-cyber-amber text-midnight-ink'
                  : 'bg-white/5 text-soft-cloud/70 border border-white/10'
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                billing === 'monthly'
                  ? 'bg-cyber-amber text-midnight-ink'
                  : 'bg-white/5 text-soft-cloud/70 border border-white/10'
              }`}
            >
              Monthly
            </button>
          </div>
          <ul className="mt-6 space-y-3 flex-1 text-sm text-soft-cloud/90">
            {SOLO_POINTS.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                {p.icon === 'mail' ? (
                  <Mail className="size-4 text-cyber-amber shrink-0 mt-0.5" />
                ) : (
                  <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                )}
                <span>{p.text}</span>
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

        {/* Card 2: Compliance Pro — Most Popular */}
        <div className="rounded-2xl border-2 border-cyber-amber/50 bg-cyber-amber/5 p-6 flex flex-col relative shadow-[0_0_40px_-12px_rgba(255,176,0,0.2)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyber-amber text-midnight-ink text-xs font-bold uppercase tracking-wide">
            Most Popular
          </div>
          <h3 className="text-xl font-bold text-soft-cloud mt-2">Compliance Pro</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">$199</span>
            <span className="text-soft-cloud/60">/ month</span>
          </div>
          <p className="mt-2 text-xs text-soft-cloud/70">
            30-day free trial. Start today for $0.00. We will email you a reminder 3 days before your trial ends.
          </p>
          <ul className="mt-6 space-y-3 flex-1 text-sm text-soft-cloud/90">
            {PRO_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="size-4 text-electric-teal shrink-0 mt-0.5" />
                <span>{point}</span>
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
      </div>

      {/* Add-ons Section */}
      <section className="border-t border-white/10 pt-12">
        <h2 className="text-lg font-bold text-soft-cloud text-center mb-8">
          Add-ons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col items-center text-center">
            <p className="font-bold text-soft-cloud">Quarterly IFTA Prep</p>
            <p className="text-2xl font-bold text-cyber-amber mt-1">$49/qtr</p>
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
