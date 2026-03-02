'use client';

import { useState } from 'react';
import { FileText, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';

function fireConfetti() {
  const count = 120;
  const defaults = { origin: { y: 0.75 }, zIndex: 9999 };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'] });
  fire(0.2, { spread: 60, colors: ['#f59e0b', '#fbbf24'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

type PowerupType = 'mcs150' | 'boc3';

const POWERUPS: { type: PowerupType; title: string; description: string; icon: typeof FileText }[] = [
  {
    type: 'mcs150',
    title: 'MCS-150 Biennial Update',
    description: 'Keep your DOT census current. We’ll remind you and streamline the filing when this power-up launches.',
    icon: FileText,
  },
  {
    type: 'boc3',
    title: 'BOC-3 Process Agent Filing',
    description: 'Designate process agents in every state you operate. One place to file and track BOC-3.',
    icon: Scale,
  },
];

export function CompliancePowerUps() {
  const [joining, setJoining] = useState<PowerupType | null>(null);
  const [joined, setJoined] = useState<Set<PowerupType>>(new Set());

  async function handleJoinWaitlist(type: PowerupType) {
    setJoining(type);
    try {
      const res = await fetch('/api/compliance-powerup-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ powerupType: type }),
      });
      const data = await res.json();
      if (res.ok) {
        setJoined((prev) => new Set(prev).add(type));
        fireConfetti();
      }
    } finally {
      setJoining(null);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-semibold text-cloud-dancer">Compliance Power-Ups</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {POWERUPS.map(({ type, title, description, icon: Icon }) => {
          const isJoined = joined.has(type);
          const isLoading = joining === type;
          return (
            <div
              key={type}
              className="relative rounded-xl border border-amber-500/20 bg-white/5 backdrop-blur-sm p-5 overflow-hidden"
            >
              <span className="absolute top-3 right-3 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                Coming soon
              </span>
              <div className="flex items-start gap-3 pr-24">
                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                  <Icon className="size-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-cloud-dancer mb-1">{title}</h3>
                  <p className="text-sm text-cloud-dancer/70">{description}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handleJoinWaitlist(type)}
                  disabled={isLoading || isJoined}
                  className="inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-60 disabled:pointer-events-none transition-colors"
                >
                  {isLoading ? 'Adding…' : isJoined ? 'On waitlist' : 'Join waitlist'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
