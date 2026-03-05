'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const CYBER_AMBER = '#FFB000';
const ELECTRIC_TEAL = '#00F5D4';

type Props = {
  name: string | null;
};

export function FounderSuccessScreen({ name }: Props) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current || typeof window === 'undefined') return;
    hasFired.current = true;

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: [CYBER_AMBER, ELECTRIC_TEAL, '#fff'],
      startVelocity: 40,
      decay: 0.92,
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.6 },
        colors: [CYBER_AMBER, ELECTRIC_TEAL],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.6 },
        colors: [CYBER_AMBER, ELECTRIC_TEAL],
      });
    }, 200);
  }, []);

  const displayName = name?.trim() || 'Founder';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-soft-cloud text-center mb-4">
        Welcome to the Inner Circle, {displayName}! 🚚
      </h1>
      <p className="text-soft-cloud/85 text-center max-w-lg mb-4">
        Your Lifetime Founder Discount is now active. You will receive 20% off your VantagFleet subscription for as long as your account is active. Thank you for being one of our first 5 partners.
      </p>
      <p className="text-soft-cloud/70 text-sm text-center max-w-lg mb-8">
        Questions or feedback? Reply to us at{' '}
        <a href="mailto:feedback@vantagfleet.com" className="text-cyber-amber hover:underline">feedback@vantagfleet.com</a>.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
