import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { canAccessVantagControlAdmin } from '@/lib/admin/control-access';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canAccessVantagControlAdmin(user.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  let body: { orgId?: string; days?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const orgId = body?.orgId?.trim();
  const days = typeof body?.days === 'number' ? body.days : parseInt(String(body?.days), 10);
  if (!orgId || !Number.isInteger(days) || days < 1 || days > 30) {
    return NextResponse.json(
      { error: 'orgId is required and days must be an integer from 1 to 30.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .select('id, name, stripe_customer_id')
    .eq('id', orgId)
    .single();

  if (orgErr || !org) {
    return NextResponse.json(
      { error: 'Organization not found.' },
      { status: 404 }
    );
  }
  if (!org.stripe_customer_id) {
    return NextResponse.json(
      {
        error: 'This organization has no Stripe subscription yet. Use "View Dashboard as [carrier]" to open the carrier dashboard—when you view as a carrier, you have full access to all features without paying.',
      },
      { status: 400 }
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const { data: subs } = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: 'all',
      limit: 5,
    });
    const active = subs?.find((s) => s.status === 'active' || s.status === 'trialing');
    if (!active) {
      return NextResponse.json(
        { error: 'No active or trialing subscription found for this carrier.' },
        { status: 404 }
      );
    }

    // Extend from current period or trial end (use subscription from list)
    const sub = active as Stripe.Subscription & { current_period_end?: number };
    const currentEnd = sub.trial_end ?? sub.current_period_end;
    if (typeof currentEnd !== 'number') {
      return NextResponse.json(
        { error: 'Subscription has no period end. Cannot grant credit.' },
        { status: 400 }
      );
    }
    const newEnd = currentEnd + days * 24 * 60 * 60;

    await stripe.subscriptions.update(active.id, {
      trial_end: newEnd,
      proration_behavior: 'none', // don't charge/credit for the change
    });

    return NextResponse.json({
      ok: true,
      success: true,
      subscriptionId: active.id,
      newBillingDate: new Date(newEnd * 1000),
      message: `Granted ${days} day${days === 1 ? '' : 's'} free credit. Next payment delayed.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
