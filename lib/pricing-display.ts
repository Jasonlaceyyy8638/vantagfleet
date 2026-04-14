/**
 * Display-only pricing (marketing + Pricing.tsx).
 * Keep Stripe Price IDs / amounts in the Stripe dashboard in sync with these numbers
 * (STRIPE_SOLO_PRO_* / STRIPE_FLEET_MASTER_* / STRIPE_ENTERPRISE_* in checkout route).
 *
 * Rationale: positions VantagFleet in the same buyer category as full TMS (vs $29/mo “app” pricing).
 */
export const PRICING_USD = {
  solo: { monthly: 59, annual: 590 },
  fleet: { monthly: 199, annual: 1990 },
  enterprise: { monthly: 449, annual: 4490 },
} as const;
