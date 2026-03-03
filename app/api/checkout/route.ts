import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not set.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const PRICE_IDS: Record<string, string> = {
    starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || process.env.STRIPE_STARTER_PRICE_ID || '',
    starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
  };

  try {
    const body = await request.json();
    const tier = body?.tier as string;
    const billing = body?.billing as string | undefined;
    const key =
      tier === 'starter'
        ? (billing === 'monthly' ? 'starter_monthly' : 'starter_annual')
        : tier === 'pro'
          ? 'pro'
          : null;
    const priceId = (key && PRICE_IDS[key]) || (tier?.startsWith('price_') ? tier : null);

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            'Invalid tier or billing. Use tier "starter" (with billing "annual" or "monthly") or "pro". Set STRIPE_STARTER_ANNUAL_PRICE_ID, STRIPE_STARTER_MONTHLY_PRICE_ID, and STRIPE_PRO_PRICE_ID in env.',
        },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const logoUrl = `${baseUrl}/logo.svg`;

    const isPro = key === 'pro';
    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: {
        business_name: 'VantagFleet',
      },
    };
    if (isPro) {
      subscriptionData.trial_period_days = 30;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?status=success`,
      cancel_url: `${baseUrl}/pricing`,
      payment_method_collection: 'always',
      metadata: {
        business_name: 'VantagFleet',
      },
      subscription_data: subscriptionData,
      branding_settings: {
        display_name: 'VantagFleet',
        button_color: '#00F5D4',
        background_color: '#0B0F19',
        logo: {
          type: 'url',
          url: logoUrl,
        },
      },
    } as Stripe.Checkout.SessionCreateParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
