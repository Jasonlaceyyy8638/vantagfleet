'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_TRIAL_DAYS } from '@/lib/beta-config';
import { PRICING_USD } from '@/lib/pricing-display';

type Billing = 'monthly' | 'yearly';

const PLAN_FEATURES = [
  'Dispatch board & full load lifecycle (stops, status, assignments)',
  'Live map & ELD-linked positions (Motive, Geotab, and more as we ship them)',
  'Driver settlements and load-linked pay workflows',
  'IFTA mileage, fuel receipts, and export-friendly reporting',
  'Documents, expirations, safety signals, and broker-friendly load tools',
  'One product surface—carriers and brokers use the same core stack',
];

const trialNote = (light: boolean) =>
  `${SUBSCRIPTION_TRIAL_DAYS}-day trial on subscription · card required at checkout`;

export function Pricing({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [loading, setLoading] = useState(false);

  const light = variant === 'light';
  const sx = {
    label: light ? 'text-slate-500' : 'text-soft-cloud/60',
    body: light ? 'text-slate-700' : 'text-soft-cloud/90',
    h3: light ? 'text-slate-900' : 'text-soft-cloud',
    card: light
      ? 'rounded-2xl border border-slate-200 bg-white p-8 flex flex-col shadow-sm max-w-xl mx-auto'
      : 'rounded-2xl border border-white/10 bg-midnight-ink p-8 flex flex-col max-w-xl mx-auto',
    toggleInactive: light ? 'text-slate-400' : 'text-soft-cloud/60',
    toggleActive: light ? 'text-slate-900' : 'text-soft-cloud',
    switchTrack: light ? 'bg-slate-200 border-slate-300' : 'bg-white/10 border-white/20',
    teal: light ? 'text-emerald-600' : 'text-electric-teal',
  };

  async function startSubscribe() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'vantag',
          billing: billing === 'yearly' ? 'annual' : 'monthly',
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`max-w-3xl mx-auto ${light ? 'text-slate-900' : ''}`}>
      <div className="flex items-center justify-center gap-3 mb-8">
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
            Save 2 months
          </span>
        )}
      </div>

      <div className={sx.card}>
        <h3 className={`text-2xl font-bold ${sx.h3}`}>VantagFleet</h3>
        <p className={`text-sm mt-1 ${sx.label}`}>Full TMS workspace — one plan while we&apos;re scaling integrations</p>
        <div className="mt-6 flex items-baseline gap-1 flex-wrap">
          <span className="text-4xl font-bold text-cyber-amber">
            {billing === 'yearly'
              ? `$${PRICING_USD.annual.toLocaleString()}`
              : `$${PRICING_USD.monthly}`}
          </span>
          <span className={`text-xl ${light ? 'text-slate-500' : 'text-soft-cloud/70'}`}>
            {billing === 'yearly' ? '/ year' : '/ month'}
          </span>
        </div>
        <p className={`mt-1 text-xs ${sx.label}`}>
          {billing === 'yearly'
            ? 'Billed annually (10× monthly rate)'
            : `or $${PRICING_USD.annual.toLocaleString()}/year`}
        </p>
        <ul className={`mt-8 space-y-3 text-sm ${sx.body}`}>
          {PLAN_FEATURES.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className={`size-4 shrink-0 mt-0.5 ${sx.teal}`} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p
          className={`mt-4 text-[11px] text-center font-medium ${
            light ? 'text-slate-600' : 'text-soft-cloud/65'
          }`}
        >
          {trialNote(light)}
        </p>
        <button
          type="button"
          onClick={startSubscribe}
          disabled={loading}
          className="mt-5 w-full py-3.5 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            `Subscribe — ${billing === 'yearly' ? 'yearly' : 'monthly'}`
          )}
        </button>
      </div>
    </div>
  );
}
