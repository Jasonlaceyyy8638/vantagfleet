'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

const TIERS: Array<{
  id: 'starter' | 'pro';
  name: string;
  price: number;
  interval: string;
  features: string[];
  highlighted?: boolean;
}> = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    interval: 'month',
    features: ['Up to 10 drivers', 'Compliance alerts', 'Document storage', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    interval: 'month',
    features: ['Unlimited drivers', 'Compliance alerts', 'Document storage', 'Priority support', 'Roadside mode', 'IFTA reporting'],
    highlighted: true,
  },
];

export function Pricing() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {TIERS.map((tier) => (
        <div
          key={tier.id}
          className={`rounded-2xl border p-6 flex flex-col ${
            tier.highlighted
              ? 'border-cyber-amber/50 bg-cyber-amber/5'
              : 'border-white/10 bg-midnight-ink'
          }`}
        >
          <h3 className="text-xl font-bold text-soft-cloud">{tier.name}</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-cyber-amber">${tier.price}</span>
            <span className="text-soft-cloud/60">/{tier.interval}</span>
          </div>
          <ul className="mt-6 space-y-3 flex-1">
            {tier.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-soft-cloud/90">
                <Check className="size-4 text-electric-teal shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => handleCheckout(tier.id)}
            disabled={!!loadingTier}
            className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loadingTier === tier.id ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Get started'
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
