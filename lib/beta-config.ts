/** Max founder beta testers (matches DB trigger / founder_slot_seq cap). */
export const BETA_FOUNDER_CAP = 5;

/**
 * Founder slot duration (matches `handle_new_user`: beta_expires_at = NOW() + 90 days).
 * First {BETA_FOUNDER_CAP} carriers get Enterprise-equivalent in-app access for this period.
 */
export const FOUNDER_ENTERPRISE_DAYS = 90;

/** Enterprise trial after founder beta is full — no card at checkout (Stripe collects when trial ends). */
export const POST_BETA_ENTERPRISE_TRIAL_DAYS = 14;
