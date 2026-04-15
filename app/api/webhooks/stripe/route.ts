import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

/**
 * Webhook runs on the server with no user session. We must use the Supabase
 * service role client (createAdminClient) so RLS does not block updates.
 * For receipts, subscription issues, and plan upgrades, direct users to billing@vantagfleet.com.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[webhooks/stripe] Signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log('[webhooks/stripe] Received event:', event.type);

  // Service role client — no user session; required for webhook DB updates
  const supabaseAdmin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    if (metadata.type === 'IFTA') {
      console.log('[webhooks/stripe] Received IFTA Payment — updating profiles.ifta_enabled');
      const userId = metadata.user_id as string | undefined;
      const orgId = metadata.org_id as string | undefined;
      if (userId && orgId) {
        try {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ ifta_enabled: true })
            .eq('user_id', userId)
            .eq('org_id', orgId);
          if (error) {
            console.error('[webhooks/stripe] Failed to set ifta_enabled:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }
          console.log('[webhooks/stripe] IFTA enabled for user', userId, 'org', orgId);
        } catch (err) {
          console.error('[webhooks/stripe] Error updating profile for IFTA:', err);
          return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
      } else {
        console.warn('[webhooks/stripe] IFTA payment missing user_id or org_id in metadata');
      }
    } else if (session.mode === 'subscription' && session.subscription) {
      console.log('[webhooks/stripe] Received subscription checkout — storing stripe_customer_id and plan_tier');
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const orgId = metadata.org_id as string | undefined;
      const planLevel = 'pro';
      const tierDb = 'enterprise';

      if (orgId && customerId) {
        try {
          const { error } = await supabaseAdmin
            .from('organizations')
            .update({
              stripe_customer_id: customerId,
              trial_active: true,
              plan_level: planLevel,
              subscription_status: 'trialing',
              tier: tierDb,
            })
            .eq('id', orgId);
          if (error) {
            console.error('[webhooks/stripe] Failed to update org after subscription:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }
          console.log('[webhooks/stripe] Subscription started for org', orgId, 'plan_level:', planLevel);
        } catch (err) {
          console.error('[webhooks/stripe] Error updating org for subscription:', err);
          return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
      } else {
        console.warn('[webhooks/stripe] Subscription checkout missing org_id or customer in session');
      }
    }
  }

  if (event.type === 'invoice.paid') {
    console.log('[webhooks/stripe] Received invoice.paid — setting subscription_status to active_paid');
    const invoice = event.data.object as Stripe.Invoice;
    const rawSub =
      (invoice as { subscription?: string | Stripe.Subscription | null }).subscription ??
      (invoice as { parent?: { subscription_details?: { subscription?: string | Stripe.Subscription } } }).parent?.subscription_details?.subscription ??
      null;
    const subscriptionId = typeof rawSub === 'string' ? rawSub : rawSub?.id ?? null;
    if (!subscriptionId) return NextResponse.json({ received: true });

    try {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      if (!customerId) return NextResponse.json({ received: true });

      const { data: org, error: findError } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .limit(1)
        .maybeSingle();

      if (findError || !org) {
        console.warn('[webhooks/stripe] No org found for customer on invoice.paid:', customerId);
        return NextResponse.json({ received: true });
      }

      const { error: updateError } = await supabaseAdmin
        .from('organizations')
        .update({ subscription_status: 'active_paid' })
        .eq('id', org.id);
      if (updateError) {
        console.error('[webhooks/stripe] Failed to set active_paid:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      console.log('[webhooks/stripe] invoice.paid: org', org.id, 'set to active_paid');
    } catch (err) {
      console.error('[webhooks/stripe] Error processing invoice.paid:', err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    console.log('[webhooks/stripe] Received customer.subscription.deleted — resetting plan to free');
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (!customerId) return NextResponse.json({ received: true });

    try {
      const { data: org, error: findError } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .limit(1)
        .maybeSingle();

      if (findError || !org) {
        console.warn('[webhooks/stripe] No org found for customer on subscription.deleted:', customerId);
        return NextResponse.json({ received: true });
      }

      const { error: updateError } = await supabaseAdmin
        .from('organizations')
        .update({
          plan_level: 'free',
          trial_active: false,
          subscription_status: 'canceled',
        })
        .eq('id', org.id);
      if (updateError) {
        console.error('[webhooks/stripe] Failed to reset plan on subscription.deleted:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      console.log('[webhooks/stripe] subscription.deleted: org', org.id, 'set to free');
    } catch (err) {
      console.error('[webhooks/stripe] Error processing subscription.deleted:', err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
