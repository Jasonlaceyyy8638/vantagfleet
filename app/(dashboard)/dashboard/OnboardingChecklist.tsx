'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Users, Truck, FileText, Check } from 'lucide-react';

const STORAGE_KEY = 'vantag-onboarding-checklist-dismissed';

type OnboardingChecklistProps = {
  driverCount: number;
  vehicleCount: number;
  docCount: number;
};

export function OnboardingChecklist({
  driverCount,
  vehicleCount,
  docCount,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash, then read from localStorage
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === 'true');
    setMounted(true);
  }, []);

  const steps = [
    { done: driverCount > 0, label: 'Add your first driver', href: '/drivers', icon: Users },
    { done: vehicleCount > 0, label: 'Add your first vehicle', href: '/vehicles', icon: Truck },
    { done: docCount > 0, label: 'Upload key compliance docs (e.g. MCS-150)', href: '/documents', icon: FileText },
  ];
  const allDone = steps.every((s) => s.done);
  const anyDone = steps.some((s) => s.done);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (!mounted || dismissed || allDone) return null;
  if (!anyDone && steps.every((s) => !s.done)) return null; // optional: only show if at least one step is in progress; here we show whenever not all done

  return (
    <div className="mb-6 rounded-xl border border-cyber-amber/30 bg-cyber-amber/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-cloud-dancer mb-1">Get your fleet set up</h2>
          <p className="text-sm text-cloud-dancer/70">Complete these steps to get the most out of VantagFleet.</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-cloud-dancer/60 hover:text-cloud-dancer hover:bg-white/5 transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="size-5" />
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3">
            {step.done ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="size-4" />
              </span>
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyber-amber/20 text-cyber-amber">
                <step.icon className="size-4" />
              </span>
            )}
            {step.done ? (
              <span className="text-cloud-dancer/70 line-through">{step.label}</span>
            ) : (
              <Link
                href={step.href}
                className="text-cyber-amber font-medium hover:underline"
              >
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
