'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 99,
    interval: 'month',
    description:
      'The Audit-Ready Essential Kit. Includes DQ Auto-Pilot, Roadside Ready Mode, and Motus Sync.',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 199,
    interval: 'month',
    description:
      'AI-Powered Performance & IFTA Elite. Includes AI DQ Scanner, 1-tap IFTA filing, and Profit AI.',
    highlighted: true,
  },
];

export function PricingSection() {
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
    <section className="relative py-24 px-4 bg-midnight-ink">
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2">
          Plans that scale with your fleet
        </h2>
        <p className="text-soft-cloud/70 text-center max-w-2xl mx-auto mb-16">
          Choose the tier that fits. Start today, upgrade anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`rounded-2xl border p-6 flex flex-col backdrop-blur-lg ${
                plan.highlighted
                  ? 'border-cyber-amber/60 bg-cyber-amber/10 shadow-[0_0_40px_-12px_rgba(255,176,0,0.2)]'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <h3 className="text-xl font-bold text-soft-cloud">{plan.name} Plan</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-cyber-amber">${plan.price}</span>
                <span className="text-soft-cloud/60">/{plan.interval}</span>
              </div>
              <p className="mt-4 text-sm text-soft-cloud/80 leading-relaxed flex-1">
                {plan.description}
              </p>
              <button
                type="button"
                onClick={() => handleCheckout(plan.id)}
                disabled={!!loadingTier}
                className="mt-6 w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {loadingTier === plan.id ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  'Get Started'
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
