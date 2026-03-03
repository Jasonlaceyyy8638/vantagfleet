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

  const planName = tierLabel === 'Pro' ? 'Compliance Pro' : tierLabel === 'Solo' ? 'Solo Guard' : null;

  return <PricingSuccessClient planName={planName} />;
}
