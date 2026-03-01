import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  let body: { charge_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const charge_id = body?.charge_id?.trim();
  if (!charge_id) {
    return NextResponse.json({ error: 'charge_id is required.' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const refund = await stripe.refunds.create({ charge: charge_id });
    return NextResponse.json({ id: refund.id, status: refund.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refund failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
