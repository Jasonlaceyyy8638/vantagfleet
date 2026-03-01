'use server';

import Stripe from 'stripe';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const ok = await isAdmin(supabase);
  if (!ok) throw new Error('Forbidden');
}

export type StripeStats = {
  total_revenue: number;
  active_subscriptions: number;
};

/**
 * Fetches Stripe metrics for the admin dashboard using STRIPE_SECRET_KEY.
 * - total_revenue: Sum of succeeded charges from the last 30 days (USD).
 * - active_subscriptions: Count of subscriptions with status 'active'.
 */
export async function getStripeStats(): Promise<StripeStats> {
  await requireAdmin();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return { total_revenue: 0, active_subscriptions: 0 };
  }

  const stripe = new Stripe(secretKey);
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  let total_revenue = 0;
  let active_subscriptions = 0;

  try {
    const [charges, subscriptions] = await Promise.all([
      stripe.charges.list({
        created: { gte: thirtyDaysAgo },
        limit: 100,
      }),
      stripe.subscriptions.list({
        status: 'active',
        limit: 100,
      }),
    ]);

    total_revenue =
      charges.data
        .filter((c) => c.status === 'succeeded')
        .reduce((sum, c) => sum + (c.amount ?? 0), 0) / 100;

    active_subscriptions = subscriptions.data.length;
  } catch {
    return { total_revenue: 0, active_subscriptions: 0 };
  }

  return { total_revenue, active_subscriptions };
}
