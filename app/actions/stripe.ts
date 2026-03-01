'use server';

import Stripe from 'stripe';

export async function createCustomerPortal(stripe_customer_id: string): Promise<
  { url: string } | { error: string }
> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return { error: 'Stripe is not configured.' };
  }

  const trimmed = stripe_customer_id?.trim();
  if (!trimmed) {
    return { error: 'Customer ID is required.' };
  }

  try {
    const stripe = new Stripe(secretKey);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: trimmed,
      return_url: `${baseUrl}/settings`,
    });

    if (!session.url) {
      return { error: 'Could not create portal session.' };
    }

    return { url: session.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Portal session failed';
    return { error: message };
  }
}
