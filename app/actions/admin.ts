'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-log';

async function requireStaff() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) throw new Error('Forbidden');
}

export type CustomerRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  stripe_customer_id: string | null;
  status: string;
  created_at: string;
};

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'none';

export async function getSubscriptionStatus(
  stripeCustomerId: string
): Promise<SubscriptionStatus> {
  await requireStaff();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return 'none';
  const stripe = new Stripe(secretKey);
  const { data } = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 1,
  });
  const sub = data[0];
  if (!sub) return 'none';
  if (sub.status === 'active' || sub.status === 'trialing') return sub.status as SubscriptionStatus;
  if (sub.status === 'past_due') return 'past_due';
  if (sub.status === 'canceled' || sub.status === 'unpaid') return 'canceled';
  return 'none';
}

export async function searchCustomers(query: string): Promise<CustomerRow[]> {
  await requireStaff();
  const admin = createAdminClient();
  const q = (query || '').trim();

  const orgIdsByEmail = new Set<string>();
  if (q.length > 0 && q.includes('@')) {
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const matching = (users ?? []).filter((u) => u.email?.toLowerCase().includes(q.toLowerCase()));
    for (const u of matching) {
      const { data: profs } = await admin.from('profiles').select('org_id').eq('user_id', u.id);
      (profs ?? []).forEach((p) => p.org_id && orgIdsByEmail.add(p.org_id));
    }
  }

  let builder = admin
    .from('organizations')
    .select('id, name, usdot_number, stripe_customer_id, status, created_at')
    .order('created_at', { ascending: false });

  if (q.length > 0) {
    if (orgIdsByEmail.size > 0) {
      builder = builder.in('id', Array.from(orgIdsByEmail));
    } else {
      builder = builder.or(`name.ilike.%${q}%,usdot_number.ilike.%${q}%`);
    }
  }

  const { data, error } = await builder.limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerRow[];
}

export type ChargeRow = {
  id: string;
  amount: number;
  currency: string;
  created: number;
  status: string;
  description: string | null;
  refunded: boolean;
  payment_intent: string | null;
};

export async function getCustomerCharges(
  stripeCustomerId: string
): Promise<ChargeRow[]> {
  await requireStaff();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return [];

  const stripe = new Stripe(secretKey);
  const { data } = await stripe.charges.list({
    customer: stripeCustomerId,
    limit: 20,
  });

  return data.map((c) => ({
    id: c.id,
    amount: c.amount,
    currency: c.currency,
    created: c.created,
    status: c.status,
    description: c.description ?? null,
    refunded: c.refunded ?? false,
    payment_intent: typeof c.payment_intent === 'string' ? c.payment_intent : c.payment_intent?.id ?? null,
  }));
}

export async function addNewCustomer(
  name: string,
  usdot_number: string | null
): Promise<{ orgId: string; stripeCustomerId: string } | { error: string }> {
  const supabaseAuth = await createClient();
  const role = await getPlatformRole(supabaseAuth);
  if (!isPlatformStaff(role)) return { error: 'Forbidden' };
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const trimmedName = name?.trim();
  if (!trimmedName) return { error: 'Company name is required.' };

  const supabase = createAdminClient();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { error: 'Stripe is not configured.' };

  try {
    const stripe = new Stripe(secretKey);
    const customer = await stripe.customers.create({
      name: trimmedName,
      metadata: {},
    });

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: trimmedName,
        usdot_number: usdot_number?.trim() || null,
        status: 'active',
        stripe_customer_id: customer.id,
      })
      .select('id')
      .single();

    if (error) {
      await stripe.customers.del(customer.id);
      return { error: error.message };
    }

    await logAdminAction(user.id, 'organization_created', org.id, {
      name: trimmedName,
      usdot_number: usdot_number?.trim() || null,
      stripe_customer_id: customer.id,
    });

    return { orgId: org.id, stripeCustomerId: customer.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create customer';
    return { error: message };
  }
}

export async function updateOrganization(
  orgId: string,
  updates: { name?: string; usdot_number?: string | null; status?: string }
): Promise<{ ok: true } | { error: string }> {
  const supabaseAuth = await createClient();
  const role = await getPlatformRole(supabaseAuth);
  if (!isPlatformStaff(role)) return { error: 'Forbidden' };
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.usdot_number !== undefined && { usdot_number: updates.usdot_number?.trim() || null }),
      ...(updates.status !== undefined && { status: updates.status }),
    })
    .eq('id', orgId);

  if (error) return { error: error.message };

  await logAdminAction(user.id, 'organization_updated', orgId, updates);
  return { ok: true };
}

/** Create an invite link for an org (admin helper for "Manage organization"). */
export async function createOrgInviteLink(orgId: string): Promise<{ url: string } | { error: string }> {
  await requireStaff();
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const admin = createAdminClient();
  const token = crypto.randomUUID().replace(/-/g, '');
  const { error } = await admin.from('org_invites').insert({
    org_id: orgId,
    token,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return { url: `${base}/invite?token=${token}` };
}

/** Manually create a Stripe subscription for a customer (e.g. support upgrade). */
export async function createManualSubscription(
  orgId: string,
  tier: 'starter' | 'pro'
): Promise<{ subscriptionId: string } | { error: string }> {
  await requireStaff();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!secretKey) return { error: 'Stripe is not configured.' };

  const priceId = tier === 'pro' ? proPriceId : starterPriceId;
  if (!priceId) return { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is not set.` };

  const admin = createAdminClient();
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single();

  if (orgError || !org?.stripe_customer_id) {
    return { error: 'Organization has no Stripe customer. They need to subscribe from the app first, or add a payment method.' };
  }

  try {
    const stripe = new Stripe(secretKey);
    const subscription = await stripe.subscriptions.create({
      customer: org.stripe_customer_id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) {
      await logAdminAction(user.id, 'manual_subscription', orgId, {
        tier,
        subscriptionId: subscription.id,
      });
    }

    return { subscriptionId: subscription.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create subscription';
    return { error: message };
  }
}
