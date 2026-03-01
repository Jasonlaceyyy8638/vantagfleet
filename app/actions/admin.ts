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

export async function searchCustomers(query: string): Promise<CustomerRow[]> {
  await requireStaff();
  const supabase = createAdminClient();
  const q = (query || '').trim();
  let builder = supabase
    .from('organizations')
    .select('id, name, usdot_number, stripe_customer_id, status, created_at')
    .order('created_at', { ascending: false });

  if (q.length > 0) {
    builder = builder.or(`name.ilike.%${q}%,usdot_number.ilike.%${q}%`);
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
