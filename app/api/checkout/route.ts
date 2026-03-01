import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not set.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const PRICE_IDS: Record<string, string> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
  };

  try {
    const body = await request.json();
    const tier = body?.tier as string;
    const priceId = (tier && PRICE_IDS[tier]) || (tier?.startsWith('price_') ? tier : null);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier. Use "starter" or "pro". Set STRIPE_STARTER_PRICE_ID and STRIPE_PRO_PRICE_ID in env.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const logoUrl = `${baseUrl}/logo.svg`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        business_name: 'VantagFleet',
      },
      subscription_data: {
        metadata: {
          business_name: 'VantagFleet',
        },
      },
      branding_settings: {
        display_name: 'VantagFleet',
        button_color: '#00F5D4',
        background_color: '#0B0F19',
        logo: {
          type: 'url',
          url: logoUrl,
        },
      },
      payment_method_options: {
        card: {
          statement_descriptor_suffix: 'VANTAGFLEET COMPLIANCE',
        },
      },
      invoice_creation: {
        enabled: true,
      },
    } as Stripe.Checkout.SessionCreateParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
