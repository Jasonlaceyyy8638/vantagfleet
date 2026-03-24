'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { POST_BETA_ENTERPRISE_TRIAL_DAYS } from '@/lib/beta-config';

/** Under-nav promo on home when founder beta (5 spots) is full: Enterprise trial without card at checkout. */
export function PostBetaEnterpriseTrialBanner() {
  const [loading, setLoading] = useState(false);

  const startTrial = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'enterprise',
          billing: 'monthly',
          post_beta_enterprise_trial: true,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error) alert(data.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-cyber-amber/50 bg-gradient-to-br from-cyber-amber/25 via-midnight-ink to-blue-600/20 px-4 py-5 sm:py-6 shadow-[0_0_40px_-8px_rgba(255,176,0,0.35)]"
    >
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-cyber-amber/20 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-blue-500/15 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyber-amber/40 bg-midnight-ink/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyber-amber">
            <Sparkles className="size-3.5" aria-hidden />
            Founder beta full — next best thing
            <Zap className="size-3.5" aria-hidden />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            <span className="text-cyber-amber">{POST_BETA_ENTERPRISE_TRIAL_DAYS}-day Enterprise trial</span>
            {' · '}
            <span className="text-emerald-300 font-semibold">no credit card required</span>
          </h3>
          <p className="text-sm text-slate-300 max-w-lg">
            Full Enterprise: fleet map, dispatch workflows, multi-location compliance. Start on the web — add a card only when your trial ends.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md justify-center">
            <button
              type="button"
              onClick={startTrial}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-cyber-amber px-6 py-3 text-midnight-ink font-bold text-sm sm:text-base hover:bg-cyber-amber/90 disabled:opacity-60 shadow-lg shadow-cyber-amber/25"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : null}
              {loading ? 'Opening checkout…' : `Start ${POST_BETA_ENTERPRISE_TRIAL_DAYS}-day Enterprise trial`}
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center min-h-[48px] rounded-xl border-2 border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-cyber-amber/50 hover:text-cyber-amber transition-colors"
            >
              Compare plans
            </Link>
          </div>
        </div>
    </motion.div>
  );
}
