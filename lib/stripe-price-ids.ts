/**
 * Stripe Price IDs — canonical env names:
 *
 *   Primary (single plan): STRIPE_VANTAG_MONTHLY_PRICE_ID, STRIPE_VANTAG_ANNUAL_PRICE_ID
 *   IFTA add-on:          STRIPE_IFTA_PRICE_ID
 *
 * Legacy Solo / Fleet / Enterprise env names are still fallbacks so older deployments keep working.
 */
function first(...values: Array<string | undefined>): string {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return '';
}

/** Keys used by /api/checkout internal tier + billing resolution. */
export function getCheckoutPriceIds(): Record<string, string> {
  const e = process.env;
  return {
    vantag_monthly: first(
      e.STRIPE_VANTAG_MONTHLY_PRICE_ID,
      e.STRIPE_SOLO_MONTHLY_PRICE_ID,
      e.STRIPE_STARTER_MONTHLY_PRICE_ID,
      e.STRIPE_SOLO_PRO_MONTHLY_PRICE_ID
    ),
    vantag_annual: first(
      e.STRIPE_VANTAG_ANNUAL_PRICE_ID,
      e.STRIPE_SOLO_ANNUAL_PRICE_ID,
      e.STRIPE_STARTER_ANNUAL_PRICE_ID,
      e.STRIPE_STARTER_PRICE_ID,
      e.STRIPE_SOLO_PRO_ANNUAL_PRICE_ID
    ),
    starter_monthly: first(
      e.STRIPE_SOLO_MONTHLY_PRICE_ID,
      e.STRIPE_STARTER_MONTHLY_PRICE_ID,
      e.STRIPE_SOLO_PRO_MONTHLY_PRICE_ID
    ),
    starter_annual: first(
      e.STRIPE_SOLO_ANNUAL_PRICE_ID,
      e.STRIPE_STARTER_ANNUAL_PRICE_ID,
      e.STRIPE_STARTER_PRICE_ID,
      e.STRIPE_SOLO_PRO_ANNUAL_PRICE_ID
    ),
    pro: first(e.STRIPE_FLEET_MONTHLY_PRICE_ID, e.STRIPE_PRO_PRICE_ID, e.STRIPE_FLEET_MASTER_MONTHLY_PRICE_ID),
    pro_annual: first(
      e.STRIPE_FLEET_ANNUAL_PRICE_ID,
      e.STRIPE_FLEET_MASTER_ANNUAL_PRICE_ID,
      e.STRIPE_PRO_ANNUAL_PRICE_ID
    ),
    enterprise_monthly: first(
      e.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
      e.STRIPE_ENTERPRISE_PRICE_ID,
      e.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID
    ),
    enterprise_annual: first(
      e.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID,
      e.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
      e.STRIPE_ENTREPRISE_ANNUAL_PRICE_ID
    ),
    ifta: first(e.STRIPE_IFTA_PRICE_ID),
  };
}

/** Staff manual subscription / downgrade: default monthly Solo vs Fleet. */
export function getStripeSoloMonthlyPriceId(): string {
  return first(
    process.env.STRIPE_VANTAG_MONTHLY_PRICE_ID,
    process.env.STRIPE_SOLO_MONTHLY_PRICE_ID,
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    process.env.STRIPE_STARTER_PRICE_ID,
    process.env.STRIPE_SOLO_PRO_MONTHLY_PRICE_ID
  );
}

export function getStripeFleetMonthlyPriceId(): string {
  return first(
    process.env.STRIPE_VANTAG_MONTHLY_PRICE_ID,
    process.env.STRIPE_FLEET_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_FLEET_MASTER_MONTHLY_PRICE_ID
  );
}

/** Human hint when checkout cannot resolve a price for this internal key. */
export function checkoutPriceEnvHint(internalKey: string): string {
  const hints: Record<string, string> = {
    vantag_monthly: 'STRIPE_VANTAG_MONTHLY_PRICE_ID (fallbacks: STRIPE_SOLO_* / STRIPE_STARTER_*)',
    vantag_annual:
      'STRIPE_VANTAG_ANNUAL_PRICE_ID (fallbacks: STRIPE_SOLO_ANNUAL_PRICE_ID / STRIPE_STARTER_* / STRIPE_SOLO_PRO_ANNUAL_PRICE_ID)',
    starter_monthly:
      'STRIPE_SOLO_MONTHLY_PRICE_ID (or STRIPE_STARTER_MONTHLY_PRICE_ID / STRIPE_SOLO_PRO_MONTHLY_PRICE_ID)',
    starter_annual:
      'STRIPE_SOLO_ANNUAL_PRICE_ID (or STRIPE_STARTER_ANNUAL_PRICE_ID / STRIPE_STARTER_PRICE_ID / STRIPE_SOLO_PRO_ANNUAL_PRICE_ID)',
    pro: 'STRIPE_FLEET_MONTHLY_PRICE_ID (or STRIPE_PRO_PRICE_ID / STRIPE_FLEET_MASTER_MONTHLY_PRICE_ID)',
    pro_annual:
      'STRIPE_FLEET_ANNUAL_PRICE_ID (or STRIPE_FLEET_MASTER_ANNUAL_PRICE_ID / STRIPE_PRO_ANNUAL_PRICE_ID)',
    enterprise_monthly:
      'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID (fallbacks: STRIPE_ENTERPRISE_PRICE_ID, STRIPE_ENTREPRISE_MONTHLY_PRICE_ID)',
    enterprise_annual:
      'STRIPE_ENTERPRISE_ANNUAL_PRICE_ID (fallbacks: STRIPE_ENTERPRISE_YEARLY_PRICE_ID, STRIPE_ENTREPRISE_ANNUAL_PRICE_ID)',
  };
  return hints[internalKey] ?? 'the matching STRIPE_*_PRICE_ID for this plan';
}
