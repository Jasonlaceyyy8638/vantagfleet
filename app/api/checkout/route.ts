import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';
import { EMAIL_BILLING } from '@/lib/email-addresses';
import { SUBSCRIPTION_TRIAL_DAYS } from '@/lib/beta-config';
import { checkoutPriceEnvHint, getCheckoutPriceIds } from '@/lib/stripe-price-ids';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not set.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const logoUrl = `${baseUrl}/logo.svg`;

  const PRICE_IDS = getCheckoutPriceIds();

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
          support_email: EMAIL_BILLING,
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

    const billing = (body?.billing as string | undefined)?.toLowerCase().trim();
    const isAnnual = billing === 'annual' || billing === 'yearly';

    const tierLc = (tier ?? '').toString().trim().toLowerCase();
    const isSolo = tierLc === 'solo_pro' || tierLc === 'starter' || tierLc === 'solo';
    const isFleet = tierLc === 'fleet_master' || tierLc === 'pro' || tierLc === 'fleet';
    const isEnt = tierLc === 'enterprise';

    let key: string | null = null;
    if (isSolo) {
      key = isAnnual ? 'starter_annual' : 'starter_monthly';
    } else if (isFleet) {
      key = isAnnual ? 'pro_annual' : 'pro';
    } else if (isEnt) {
      key = isAnnual ? 'enterprise_annual' : 'enterprise_monthly';
    }

    const rawTier = tier?.trim();
    const priceId =
      (key && PRICE_IDS[key]) || (rawTier?.startsWith('price_') ? rawTier : null);

    if (!priceId) {
      if (!key) {
        return NextResponse.json(
          {
            error: `Unknown tier "${tier ?? ''}". Use solo_pro, fleet_master, or enterprise (or raw Stripe price id starting with price_). Billing: monthly, annual, or yearly.`,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: `Stripe price ID is not configured for this plan (${key}). Set ${checkoutPriceEnvHint(key)} in your environment.`,
        },
        { status: 400 }
      );
    }

    const isPro = key === 'pro' || key === 'pro_annual';
    const isEnterprise = key === 'enterprise_monthly' || key === 'enterprise_annual';
    const tierLabel = isEnterprise ? 'Enterprise' : isPro ? 'Fleet' : 'Solo';

    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
      metadata: {
        business_name: 'VantagFleet',
        tier: tierLabel,
      },
    };

    let orgId: string | undefined;
    let isBeta = false;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cookieStore = await cookies();
        orgId = (await getDashboardOrgId(supabase, cookieStore)) ?? undefined;
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
      // ignore
    }

    /** Card collected at checkout before trial (required). */
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: isBeta ? `${baseUrl}/dashboard/success` : `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      payment_method_collection: 'always',
      metadata: {
        business_name: 'VantagFleet',
        tier: tierLabel,
        support_email: EMAIL_BILLING,
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
