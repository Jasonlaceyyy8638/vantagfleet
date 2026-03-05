import Stripe from 'stripe';
import { PricingSuccessClient } from './PricingSuccessClient';

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function PricingSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim();
  let tierLabel: string | null = null;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      tierLabel = (session.metadata?.tier as string) || null;
    } catch {
      // ignore; show generic welcome
    }
  }

  // Use Stripe metadata tier as display name; map legacy tier values to current plan names only (never show old "Solo Guard" / "Compliance Pro")
  const planName =
    tierLabel === 'Solo Pro' || tierLabel === 'Fleet Master' || tierLabel === 'Enterprise'
      ? tierLabel
      : tierLabel === 'Solo'
        ? 'Solo Pro'
        : tierLabel === 'Pro'
          ? 'Fleet Master'
          : null;

  return <PricingSuccessClient planName={planName} />;
}
