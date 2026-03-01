'use client';

import { useState } from 'react';
import { createCustomerPortal } from '@/app/actions/stripe';
import { CreditCard, Loader2 } from 'lucide-react';

type Props = {
  stripeCustomerId: string | null;
};

export function ManageSubscriptionButton({ stripeCustomerId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!stripeCustomerId) return;
    setLoading(true);
    try {
      const result = await createCustomerPortal(stripeCustomerId);
      if ('url' in result) {
        window.location.href = result.url;
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!stripeCustomerId) {
    return (
      <p className="text-sm text-soft-cloud/60">
        No subscription linked to this organization. Subscribe from the <a href="/pricing" className="text-cyber-amber hover:underline">pricing page</a>.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CreditCard className="size-4" />
      )}
      Manage Subscription
    </button>
  );
}
