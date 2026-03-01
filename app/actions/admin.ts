'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformRole, isPlatformStaff, isAdmin } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-log';

/** Allow owner (ADMIN_OWNER_ID) and anyone with isAdmin; else require platform_roles staff. */
async function requireStaff() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (admin) return;
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
    .order('id', { ascending: false });
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

export type AdminStats = {
  totalRevenue: number;
  activeFleets: number;
  newSignupsThisWeek: number;
};

/** Financial dashboard stats. Admin-only. */
export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const admin = createAdminClient();

  let totalRevenue = 0;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (secretKey) {
    try {
      const stripe = new Stripe(secretKey);
      const charges = await stripe.charges.list({ limit: 100 });
      totalRevenue = charges.data
        .filter((c) => c.status === 'succeeded')
        .reduce((sum, c) => sum + (c.amount ?? 0), 0) / 100;
    } catch {
      // ignore
    }
  }

  const { count: activeFleets } = await admin
    .from('organizations')
    .select('id', { count: 'exact', head: true });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newSignupsThisWeek } = await admin
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  return {
    totalRevenue,
    activeFleets: activeFleets ?? 0,
    newSignupsThisWeek: newSignupsThisWeek ?? 0,
  };
}

export type CarrierRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  subscriptionStatus: SubscriptionStatus;
};

/** All carriers (organizations) with Stripe subscription status. Admin-only. */
export async function getCarriersWithSubscription(): Promise<CarrierRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: orgs, error } = await admin
    .from('organizations')
    .select('id, name, usdot_number, stripe_customer_id')
    .order('name');
  if (error) throw new Error(error.message);
  if (!orgs?.length) return [];

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const stripe = secretKey ? new Stripe(secretKey) : null;

  const rows: CarrierRow[] = [];
  for (const org of orgs) {
    let status: SubscriptionStatus = 'none';
    if (org.stripe_customer_id && stripe) {
      try {
        const { data } = await stripe.subscriptions.list({
          customer: org.stripe_customer_id,
          status: 'all',
          limit: 1,
        });
        const sub = data[0];
        if (sub) {
          if (sub.status === 'active' || sub.status === 'trialing') status = sub.status as SubscriptionStatus;
          else if (sub.status === 'past_due') status = 'past_due';
          else if (sub.status === 'canceled' || sub.status === 'unpaid') status = 'canceled';
        }
      } catch {
        // leave none
      }
    }
    rows.push({
      id: org.id,
      name: org.name,
      usdot_number: org.usdot_number ?? null,
      subscriptionStatus: status,
    });
  }
  return rows;
}

export type CarrierIntegrationsRow = {
  id: string;
  name: string;
  usdot_number: string | null;
  integrations: string[];
};

/** Carriers and their active integrations (Samsara, Motive, FMCSA). Admin-only. Returns [] on error (e.g. table not yet migrated). */
export async function listCarriersWithIntegrations(): Promise<CarrierIntegrationsRow[]> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: orgs, error: orgErr } = await admin
      .from('organizations')
      .select('id, name, usdot_number')
      .order('name');
    if (orgErr || !orgs?.length) return [];

    const { data: ints } = await admin
      .from('carrier_integrations')
      .select('org_id, provider');

    const byOrg = new Map<string, string[]>();
    for (const i of ints ?? []) {
      const list = byOrg.get(i.org_id) ?? [];
      if (!list.includes(i.provider)) list.push(i.provider);
      byOrg.set(i.org_id, list);
    }

    return orgs.map((o) => ({
      id: o.id,
      name: o.name,
      usdot_number: o.usdot_number ?? null,
      integrations: (byOrg.get(o.id) ?? []).sort(),
    }));
  } catch {
    return [];
  }
}

/** Total vehicle count across all orgs that have Motive connected. Admin-only. */
export async function getTotalVehiclesFromConnectedCarriers(): Promise<number> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: orgRows } = await admin
      .from('carrier_integrations')
      .select('org_id')
      .eq('provider', 'motive');
    const orgIds = Array.from(new Set((orgRows ?? []).map((r) => r.org_id)));
    if (orgIds.length === 0) return 0;
    const { count, error } = await admin
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .in('org_id', orgIds);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type MotiveDriverRow = {
  id: string;
  name: string;
  org_id: string;
  org_name: string;
  motive_id: string;
};

/** Drivers imported from Motive (motive_id set), with org name. Staff (admin or employee) only. */
export async function listMotiveDrivers(): Promise<MotiveDriverRow[]> {
  try {
    await requireStaff();
    const admin = createAdminClient();
    const { data: drivers, error: drErr } = await admin
      .from('drivers')
      .select('id, name, org_id, motive_id')
      .not('motive_id', 'is', null)
      .order('name');
    if (drErr || !drivers?.length) return [];
    const orgIds = Array.from(new Set(drivers.map((d) => d.org_id)));
    const { data: orgs } = await admin.from('organizations').select('id, name').in('id', orgIds);
    const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name ?? '—']));
    return drivers.map((d) => ({
      id: d.id,
      name: d.name,
      org_id: d.org_id,
      org_name: orgMap.get(d.org_id) ?? '—',
      motive_id: d.motive_id as string,
    }));
  } catch {
    return [];
  }
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
