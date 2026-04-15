/**
 * Display-only pricing (marketing + Pricing.tsx).
 * Checkout bills your Stripe Price objects (env IDs below)—keep amounts aligned when you change these numbers.
 *
 * Single public plan for now. Env: STRIPE_VANTAG_MONTHLY_PRICE_ID, STRIPE_VANTAG_ANNUAL_PRICE_ID (see lib/stripe-price-ids.ts).
 */
export const PRICING_USD = {
  /** Full VantagFleet — monthly */
  monthly: 129,
  /** Full VantagFleet — annual (10× monthly ≈ “save two months” vs 12×) */
  annual: 1290,
} as const;
