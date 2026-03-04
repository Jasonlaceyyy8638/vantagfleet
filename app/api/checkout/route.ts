import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not set.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const logoUrl = `${baseUrl}/logo.svg`;

  const PRICE_IDS: Record<string, string> = {
    starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || process.env.STRIPE_STARTER_PRICE_ID || process.env.STRIPE_SOLO_PRO_ANNUAL_PRICE_ID || '',
    starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || process.env.STRIPE_SOLO_PRO_MONTHLY_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_FLEET_MASTER_MONTHLY_PRICE_ID || '',
    pro_annual: process.env.STRIPE_FLEET_MASTER_ANNUAL_PRICE_ID || process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
    enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    enterprise_annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '',
    ifta: process.env.STRIPE_IFTA_PRICE_ID || '',
  };

  try {
    const body = await request.json();
    const type = body?.type as string | undefined;
    const tier = body?.tier as string | undefined;

    // IFTA add-on: one-time payment, requires auth
    if (type === 'ifta' || tier === 'ifta') {
      const iftaPriceId = PRICE_IDS.ifta;
      if (!iftaPriceId) {
        return NextResponse.json(
          { error: 'IFTA add-on not configured. Set STRIPE_IFTA_PRICE_ID in env.' },
          { status: 400 }
        );
      }
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Sign in to purchase the IFTA add-on.' }, { status: 401 });
      }
      const cookieStore = await cookies();
      const orgId = await getDashboardOrgId(supabase, cookieStore);
      if (!orgId) {
        return NextResponse.json({ error: 'Select an organization first.' }, { status: 400 });
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_beta_tester')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .single();
      // Only first 5 signups get is_beta_tester (DB trigger); 6th+ pay full price.
      const isBeta = (profile as { is_beta_tester?: boolean } | null)?.is_beta_tester === true;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: iftaPriceId, quantity: 1 }],
        success_url: isBeta ? `${baseUrl}/dashboard/success` : `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          type: 'IFTA',
          user_id: user.id,
          org_id: orgId,
        },
        discounts: isBeta ? [{ coupon: 'beta-tester-20' }] : [],
        branding_settings: {
          display_name: 'VantagFleet',
          button_color: '#00F5D4',
          background_color: '#0B0F19',
          logo: { type: 'url', url: logoUrl },
        },
      } as Stripe.Checkout.SessionCreateParams);
      return NextResponse.json({ url: session.url });
    }

    // Subscription tiers: solo_pro, fleet_master, enterprise (billing: monthly | annual)
    const billing = body?.billing as string | undefined;
    const isAnnual = billing === 'annual';
    let key: string | null = null;
    if (tier === 'starter' || tier === 'solo_pro') {
      key = isAnnual ? 'starter_annual' : 'starter_monthly';
    } else if (tier === 'pro' || tier === 'fleet_master') {
      key = isAnnual ? 'pro_annual' : 'pro';
    } else if (tier === 'enterprise') {
      key = isAnnual ? 'enterprise_annual' : 'enterprise_monthly';
    }
    const priceId = (key && PRICE_IDS[key]) || (tier?.startsWith('price_') ? tier : null);

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            'Invalid tier or billing. Use tier "solo_pro", "fleet_master", or "enterprise" with billing "annual" or "monthly".',
        },
        { status: 400 }
      );
    }

    const isPro = key === 'pro' || key === 'pro_annual';
    const isEnterprise = key === 'enterprise_monthly' || key === 'enterprise_annual';
    const tierLabel = isEnterprise ? 'Enterprise' : isPro ? 'Fleet Master' : 'Solo Pro';
    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: { business_name: 'VantagFleet', tier: tierLabel },
    };
    if (isPro) {
      subscriptionData.trial_period_days = 30;
    }

    // Optional: link subscription to org when user is logged in (for webhook to set stripe_customer_id / trial_active)
    let orgId: string | undefined;
    let isBeta = false;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cookieStore = await cookies();
        orgId = await getDashboardOrgId(supabase, cookieStore) ?? undefined;
        if (orgId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_beta_tester')
            .eq('user_id', user.id)
            .eq('org_id', orgId)
            .single();
          isBeta = (profile as { is_beta_tester?: boolean } | null)?.is_beta_tester === true;
        }
      }
    } catch {
      // ignore; checkout continues without org link
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: isBeta ? `${baseUrl}/dashboard/success` : `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      payment_method_collection: 'always',
      metadata: {
        business_name: 'VantagFleet',
        tier: tierLabel,
        ...(orgId && { org_id: orgId }),
      },
      subscription_data: subscriptionData,
      discounts: isBeta ? [{ coupon: 'beta-tester-20' }] : [],
      branding_settings: {
        display_name: 'VantagFleet',
        button_color: '#00F5D4',
        background_color: '#0B0F19',
        logo: { type: 'url', url: logoUrl },
      },
    } as Stripe.Checkout.SessionCreateParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
