'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformRole, isPlatformStaff, isAdmin } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-log';

async function requireStaff() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) throw new Error('Forbidden');
}

async function requireAdmin() {
  const supabase = await createClient();
  const ok = await isAdmin(supabase);
  if (!ok) throw new Error('Forbidden');
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

/** Manual org creation for support: create org (with Stripe customer) and optionally link a customer by email as Owner. */
export async function createOrganizationForCustomer(
  name: string,
  usdot_number: string,
  fleet_size: number | null,
  customerEmail?: string | null
): Promise<{ orgId: string; stripeCustomerId: string } | { error: string }> {
  const supabaseAuth = await createClient();
  const role = await getPlatformRole(supabaseAuth);
  if (!isPlatformStaff(role)) return { error: 'Forbidden' };
  const { data: { user: staffUser } } = await supabaseAuth.auth.getUser();
  if (!staffUser) return { error: 'Not authenticated.' };

  const trimmedName = name?.trim();
  const trimmedUsdot = usdot_number?.trim();
  if (!trimmedName) return { error: 'Company name is required.' };
  if (!trimmedUsdot) return { error: 'DOT number is required.' };

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
        usdot_number: trimmedUsdot,
        status: 'active',
        stripe_customer_id: customer.id,
        fleet_size: fleet_size ?? null,
      })
      .select('id')
      .single();

    if (error) {
      await stripe.customers.del(customer.id);
      if (error.code === '23505' || error.message?.includes('organizations_usdot_number') || error.message?.includes('unique constraint')) {
        return { error: 'This DOT number is already registered.' };
      }
      return { error: error.message };
    }

    if (customerEmail?.trim()) {
      const email = customerEmail.trim().toLowerCase();
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const match = (users ?? []).find((u) => u.email?.toLowerCase() === email);
      if (match) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', match.id)
          .is('org_id', null)
          .limit(1)
          .maybeSingle();
        if (existing) {
          await supabase.from('profiles').update({ org_id: org.id, role: 'Owner' }).eq('id', existing.id);
        } else {
          await supabase.from('profiles').insert({
            user_id: match.id,
            org_id: org.id,
            role: 'Owner',
          });
        }
      }
    }

    await logAdminAction(staffUser.id, 'organization_created', org.id, {
      name: trimmedName,
      usdot_number: trimmedUsdot,
      fleet_size: fleet_size ?? null,
      customer_email: customerEmail?.trim() || null,
      stripe_customer_id: customer.id,
    });

    return { orgId: org.id, stripeCustomerId: customer.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create organization';
    return { error: message };
  }
}

export type ProfileRow = {
  profile_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  org_id: string | null;
  org_name: string | null;
  role: string;
};

/** List all profiles for admin user management. Admin-only. */
export async function listProfilesForAdmin(): Promise<ProfileRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: profiles, error: pErr } = await admin
    .from('profiles')
    .select('id, user_id, org_id, role, full_name')
    .order('created_at', { ascending: false });
  if (pErr) throw new Error(pErr.message);

  const userIds = Array.from(new Set((profiles ?? []).map((p) => p.user_id)));
  const emailByUserId: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users ?? []) {
      emailByUserId[u.id] = u.email ?? null;
    }
  }

  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null)));
  const orgNameById: Record<string, string> = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await admin.from('organizations').select('id, name').in('id', orgIds);
    for (const o of orgs ?? []) {
      orgNameById[o.id] = o.name;
    }
  }

  return (profiles ?? []).map((p) => ({
    profile_id: p.id,
    user_id: p.user_id,
    email: emailByUserId[p.user_id] ?? null,
    full_name: p.full_name ?? null,
    org_id: p.org_id ?? null,
    org_name: (p.org_id && orgNameById[p.org_id]) ?? null,
    role: p.role ?? 'Driver',
  }));
}

/** List organizations for admin dropdowns (id, name). Admin-only. */
export async function listOrganizationsForAdmin(): Promise<{ id: string; name: string }[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('organizations')
    .select('id, name')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string }[];
}

/** Assign a user to an organization (add profile row or update existing null-org profile). Admin-only. */
export async function assignUserToOrganization(
  userId: string,
  orgId: string,
  role: 'Owner' | 'Safety_Manager' | 'Driver' = 'Driver'
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle();
  if (existing) return { error: 'User is already assigned to this organization.' };

  const { data: nullOrg } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .is('org_id', null)
    .limit(1)
    .maybeSingle();

  if (nullOrg) {
    const { error: upErr } = await admin
      .from('profiles')
      .update({ org_id: orgId, role })
      .eq('id', nullOrg.id);
    if (upErr) return { error: upErr.message };
  } else {
    const { error: inErr } = await admin.from('profiles').insert({
      user_id: userId,
      org_id: orgId,
      role,
    });
    if (inErr) return { error: inErr.message };
  }
  return { ok: true };
}
