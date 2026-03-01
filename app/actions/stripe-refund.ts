'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin-log';

export const REFUND_REASONS = [
  { value: 'duplicate', label: 'Duplicate Charge' },
  { value: 'requested_by_customer', label: 'Requested by Customer' },
  { value: 'fraudulent', label: 'Fraudulent' },
] as const;

export type RefundReason = (typeof REFUND_REASONS)[number]['value'];

function mapReason(reason: string): Stripe.RefundCreateParams['reason'] | null {
  if (reason === 'duplicate' || reason === 'fraudulent' || reason === 'requested_by_customer') {
    return reason;
  }
  return null;
}

export type CreateRefundInput = {
  paymentIntentId?: string;
  chargeId?: string;
  reason: string;
  amountCents?: number;
  targetOrgId?: string;
};

export async function createRefund(
  input: CreateRefundInput
): Promise<{ refundId: string; status: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) {
    return { error: 'Forbidden. ADMIN or EMPLOYEE role required.' };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { error: 'Stripe is not configured.' };

  const reason = (input.reason || '').trim();
  const mappedReason = mapReason(reason);
  if (!mappedReason) {
    return { error: 'Invalid reason. Use: Duplicate Charge, Requested by Customer, or Fraudulent.' };
  }

  const amountCents = input.amountCents;
  if (amountCents !== undefined && (typeof amountCents !== 'number' || amountCents < 1)) {
    return { error: 'Amount must be a positive number of cents.' };
  }

  let chargeId: string;

  try {
    const stripe = new Stripe(secretKey);

    if (input.chargeId?.trim()) {
      chargeId = input.chargeId.trim();
    } else if (input.paymentIntentId?.trim()) {
      const pi = await stripe.paymentIntents.retrieve(input.paymentIntentId.trim(), {
        expand: ['latest_charge'],
      });
      const latestCharge = pi.latest_charge;
      if (!latestCharge) return { error: 'No charge found for this payment intent.' };
      chargeId = typeof latestCharge === 'string' ? latestCharge : latestCharge.id;
    } else {
      return { error: 'Either chargeId or paymentIntentId is required.' };
    }

    const charge = await stripe.charges.retrieve(chargeId);
    if (charge.refunded) {
      return { error: 'This charge has already been refunded. Duplicate refunds are not allowed.' };
    }
    if (charge.status !== 'succeeded') {
      return { error: 'Only succeeded charges can be refunded.' };
    }

    if (amountCents !== undefined && amountCents > charge.amount) {
      return { error: 'Refund amount cannot exceed the charge amount.' };
    }

    const params: Stripe.RefundCreateParams = {
      charge: chargeId,
      reason: mappedReason,
    };
    if (amountCents !== undefined) params.amount = amountCents;

    const refund = await stripe.refunds.create(params);
    await logAdminAction(user.id, 'refund', input.targetOrgId ?? null, {
      chargeId,
      refundId: refund.id,
      reason: mappedReason,
      amountCents: params.amount ?? undefined,
    });
    return { refundId: refund.id, status: refund.status ?? 'pending' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refund failed';
    return { error: message };
  }
}
