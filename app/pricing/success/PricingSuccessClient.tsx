'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const CYBER_AMBER = '#FFB000';
const ELECTRIC_TEAL = '#00F5D4';

export function PricingSuccessClient({ planName }: { planName: string | null }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current || typeof window === 'undefined') return;
    hasFired.current = true;

    // Cannon-style burst from center with brand colors
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: [CYBER_AMBER, ELECTRIC_TEAL],
      startVelocity: 35,
    });
  }, []);

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="rounded-full bg-electric-teal/20 p-4 inline-flex mb-6">
          <CheckCircle className="size-16 text-electric-teal" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-soft-cloud mb-3">Welcome to VantagFleet</h1>
        <p className="text-xl text-soft-cloud font-semibold mb-4">
          Your 7-day free trial is now active
        </p>
        <p className="text-soft-cloud/80 text-sm mb-4">
          Check your email for your trial reminder (sent 3 days before trial ends).
        </p>
        {planName && planName !== 'your plan' && (
          <p className="text-soft-cloud/70 text-sm mb-6">
            You’re on <strong>{planName}</strong>.
          </p>
        )}
        <Link
          href="/dashboard"
          className="inline-block w-full max-w-xs py-4 px-6 rounded-xl bg-cyber-amber text-midnight-ink font-bold text-lg hover:bg-cyber-amber/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
