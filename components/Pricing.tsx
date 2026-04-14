'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_TRIAL_DAYS } from '@/lib/beta-config';
import { PRICING_USD } from '@/lib/pricing-display';

type Billing = 'monthly' | 'yearly';

/** Carrier stack — shared Fleet + Enterprise carrier column. */
const CARRIER_TIER_POINTS = [
  'Dispatch board & full load lifecycle (stops, status, assignments)',
  'Live map & ELD-linked positions (Motive & Geotab integrations)',
  'Driver settlements & payroll workflows tied to loads',
  'IFTA mileage / fuel tracking and organized exports',
  'Safety, documents, and compliance monitoring in one workspace',
];

/** Broker / hybrid stack — Enterprise. */
const BROKER_TIER_POINTS = [
  'Load posting, tendering, and marketplace visibility',
  'Carrier vetting & Vantag-Verify signals on your network',
  'Margin, spread, and lane-level profitability views',
  'Customer invoicing, AR, and broker settlement workflows',
  'Milestone tracking and shared visibility for customers',
];

const SOLO_PRO_POINTS = [
  'Dispatch board & load records for one truck',
  'ELD-linked map & GPS when connected (Motive / Geotab)',
  'IFTA & fuel receipt tracking',
  'Documents, expirations, and roadside-ready file access',
  'AI receipt capture & document locker',
];

const FLEET_MASTER_POINTS = [
  'Everything in Solo, built for multi-truck operations',
  'Team-ready dispatch: drivers, units, and loads in one place',
  'Live fleet map + command center for active freight',
  'Settlements and pay flows scaled past owner-operator',
  'IFTA-ready reporting and audit-friendly organization',
];

const trialNote = (light: boolean) =>
  `${SUBSCRIPTION_TRIAL_DAYS}-day trial included`;

export function Pricing({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const light = variant === 'light';
  const sx = {
    label: light ? 'text-slate-500' : 'text-soft-cloud/60',
    body: light ? 'text-slate-700' : 'text-soft-cloud/90',
    h3: light ? 'text-slate-900' : 'text-soft-cloud',
    card: light
      ? 'rounded-2xl border border-slate-200 bg-white p-6 flex flex-col shadow-sm'
      : 'rounded-2xl border border-white/10 bg-midnight-ink p-6 flex flex-col',
    cardPopular: light
      ? 'relative rounded-2xl border-2 border-amber-400/80 bg-amber-50/50 p-6 flex flex-col shadow-md'
      : 'relative rounded-2xl border-2 border-cyber-amber/50 bg-cyber-amber/5 p-6 flex flex-col shadow-[0_0_40px_-12px_rgba(255,176,0,0.2)]',
    cardEnterprise: light
      ? 'rounded-2xl border border-slate-200 bg-white p-6 flex flex-col shadow-sm'
      : 'rounded-2xl border border-white/10 bg-midnight-ink p-6 flex flex-col',
    toggleInactive: light ? 'text-slate-400' : 'text-soft-cloud/60',
    toggleActive: light ? 'text-slate-900' : 'text-soft-cloud',
    switchTrack: light ? 'bg-slate-200 border-slate-300' : 'bg-white/10 border-white/20',
    teal: light ? 'text-emerald-600' : 'text-electric-teal',
    subhead: light ? 'text-slate-500' : 'text-soft-cloud/55',
  };

  const handleCheckout = async (tierId: 'solo_pro' | 'fleet_master' | 'enterprise') => {
    setLoadingTier(tierId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          billing: billing === 'yearly' ? 'annual' : 'monthly',
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
    <div className={`max-w-6xl mx-auto ${light ? 'text-slate-900' : ''}`}>
      <div className="flex items-center justify-center gap-3 mb-10">
        <span
          className={`text-sm font-medium ${billing === 'monthly' ? sx.toggleActive : sx.toggleInactive}`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billing === 'yearly'}
          onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
          className={`relative w-12 h-6 rounded-full border focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${sx.switchTrack}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cyber-amber transition-transform ${
              billing === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billing === 'yearly' ? sx.toggleActive : sx.toggleInactive}`}>
          Yearly
        </span>
        {billing === 'yearly' && (
          <span
            className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
              light ? 'bg-emerald-100 text-emerald-800' : 'bg-electric-teal/20 text-electric-teal'
            }`}
          >
            Save 2 Months!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className={sx.card}>
          <h3 className={`text-xl font-bold ${sx.h3}`}>Solo</h3>
          <p className={`text-xs mt-1 ${sx.label}`}>Owner-operator · one truck</p>
          <div className="mt-4 flex items-baseline gap-1 flex-wrap">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'yearly'
                ? `$${PRICING_USD.solo.annual.toLocaleString()}`
                : `$${PRICING_USD.solo.monthly}`}
            </span>
            <span className={`text-lg ${light ? 'text-slate-500' : 'text-soft-cloud/70'}`}>
              {billing === 'yearly' ? '/ yr' : '/ mo'}
            </span>
          </div>
          <p className={`mt-1 text-xs ${sx.label}`}>
            {billing === 'yearly'
              ? 'Billed annually · Save 2 months'
              : `or $${PRICING_USD.solo.annual.toLocaleString()}/year`}
          </p>
          <ul className={`mt-6 space-y-3 flex-1 text-sm ${sx.body}`}>
            {SOLO_PRO_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className={`size-4 shrink-0 mt-0.5 ${sx.teal}`} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p
            className={`mt-3 text-[11px] text-center font-medium ${
              light ? 'text-slate-600' : 'text-soft-cloud/65'
            }`}
          >
            {trialNote(light)}
          </p>
          <button
            type="button"
            onClick={() => handleCheckout('solo_pro')}
            disabled={!!loadingTier}
            className="mt-4 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'solo_pro' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>

        <div className={sx.cardPopular}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyber-amber text-midnight-ink text-xs font-bold uppercase tracking-wide">
            Most Popular
          </div>
          <h3 className={`text-xl font-bold mt-6 ${sx.h3}`}>Fleet</h3>
          <p className={`text-xs mt-1 ${sx.label}`}>Growing carriers · multi-truck dispatch</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'yearly'
                ? `$${PRICING_USD.fleet.annual.toLocaleString()}`
                : `$${PRICING_USD.fleet.monthly}`}
            </span>
            <span className={`text-lg ${light ? 'text-slate-500' : 'text-soft-cloud/60'}`}>
              {billing === 'yearly' ? '/ yr' : '/ mo'}
            </span>
          </div>
          <p className={`mt-1 text-xs ${sx.label}`}>
            {billing === 'yearly'
              ? 'Billed annually · Save 2 months'
              : `or $${PRICING_USD.fleet.annual.toLocaleString()}/year`}
          </p>
          <ul className={`mt-6 space-y-3 flex-1 text-sm ${sx.body}`}>
            {FLEET_MASTER_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className={`size-4 shrink-0 mt-0.5 ${sx.teal}`} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p
            className={`mt-3 text-[11px] text-center font-medium ${
              light ? 'text-slate-600' : 'text-soft-cloud/65'
            }`}
          >
            {trialNote(light)}
          </p>
          <button
            type="button"
            onClick={() => handleCheckout('fleet_master')}
            disabled={!!loadingTier}
            className="mt-4 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'fleet_master' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>

        <div className={sx.cardEnterprise}>
          <h3 className={`text-xl font-bold ${sx.h3}`}>Enterprise</h3>
          <p className={`mt-1 text-xs ${sx.subhead}`}>Brokers & multi-site carriers · full stack</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">
              {billing === 'yearly'
                ? `$${PRICING_USD.enterprise.annual.toLocaleString()}`
                : `$${PRICING_USD.enterprise.monthly}`}
            </span>
            <span className={`text-lg ${light ? 'text-slate-500' : 'text-soft-cloud/70'}`}>
              {billing === 'yearly' ? '/ yr' : '/ mo'}
            </span>
          </div>
          <p className={`mt-1 text-xs ${sx.label}`}>
            {billing === 'yearly'
              ? 'Billed annually · Save 2 months'
              : `or $${PRICING_USD.enterprise.annual.toLocaleString()}/year`}
          </p>
          <div className="mt-6 space-y-5 flex-1">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${sx.teal}`}>Carriers</p>
              <ul className={`space-y-3 text-sm ${sx.body}`}>
                {CARRIER_TIER_POINTS.map((point, i) => (
                  <li key={`c-${i}`} className="flex items-start gap-2">
                    <Check className={`size-4 shrink-0 mt-0.5 ${sx.teal}`} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${sx.teal}`}>Brokers</p>
              <ul className={`space-y-3 text-sm ${sx.body}`}>
                {BROKER_TIER_POINTS.map((point, i) => (
                  <li key={`b-${i}`} className="flex items-start gap-2">
                    <Check className={`size-4 shrink-0 mt-0.5 ${sx.teal}`} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p
            className={`mt-3 text-[11px] text-center font-medium ${
              light ? 'text-slate-600' : 'text-soft-cloud/65'
            }`}
          >
            {trialNote(light)}
          </p>
          <button
            type="button"
            onClick={() => handleCheckout('enterprise')}
            disabled={!!loadingTier}
            className="mt-4 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === 'enterprise' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
