/**
 * Profile shape for full-access check (beta or paid).
 */
export type ProfileForAccess = {
  is_beta_tester?: boolean | null;
  beta_expires_at?: string | null;
  subscription_status?: string | null;
  ifta_enabled?: boolean | null;
};

/**
 * Org shape for subscription status (from organizations.subscription_status).
 */
export type OrgForAccess = {
  subscription_status?: string | null;
};

/**
 * Org shape for Live Map access (tier: solo_pro | fleet_master | enterprise or display names).
 */
export type OrgForMapAccess = {
  tier?: string | null;
};

/**
 * Live Map access: true if profile.is_beta_tester OR subscription_tier is solo_pro, fleet_master, or enterprise.
 */
export function canSeeMap(
  profile: ProfileForAccess | null | undefined,
  org?: OrgForMapAccess | null
): boolean {
  if (!profile) return false;
  if (profile.is_beta_tester === true) return true;
  const tier = (org?.tier ?? '').toString().trim().toLowerCase().replace(/\s+/g, '_');
  return tier === 'solo_pro' || tier === 'fleet_master' || tier === 'enterprise';
}

/**
 * Full access: true if
 * - profile.is_beta_tester === true AND (today < profile.beta_expires_at OR beta_expires_at is null),
 * - OR profile.subscription_status === 'active' (or org subscription is active).
 * Use for premium features: IFTA, VIN Decoder, Load Profitability, Driver Assignment.
 */
export function userHasAccess(
  profile: ProfileForAccess | null | undefined,
  org?: OrgForAccess | null
): boolean {
  if (!profile) return false;

  const now = new Date();

  if (profile.is_beta_tester === true) {
    const expiresAt = profile.beta_expires_at;
    if (expiresAt == null) return true;
    try {
      const expiry = new Date(expiresAt);
      if (!Number.isNaN(expiry.getTime()) && now < expiry) return true;
    } catch {
      return true;
    }
  }

  const sub = profile.subscription_status ?? org?.subscription_status ?? '';
  const active = sub === 'active' || sub === 'active_paid' || sub === 'trialing';
  if (active) return true;

  return !!profile.ifta_enabled;
}

/**
 * Whether to show the "BETA ACCESS" ribbon (beta tester with valid access).
 */
export function showBetaRibbon(
  profile: ProfileForAccess | null | undefined,
  _org?: OrgForAccess | null
): boolean {
  if (!profile?.is_beta_tester) return false;
  const expiresAt = profile.beta_expires_at;
  if (expiresAt == null) return true;
  try {
    return new Date(expiresAt) > new Date();
  } catch {
    return true;
  }
}

/**
 * Full access (for feature lock): true if
 * (is_beta_tester AND beta_expires_at > now) OR subscription_status === 'active'.
 * Use for Load Board, IFTA Scanner, VIN Decoder.
 */
export function hasFullAccess(
  profile: ProfileForAccess | null | undefined,
  org?: OrgForAccess | null
): boolean {
  if (!profile) return false;
  const now = new Date();
  const sub = profile.subscription_status ?? org?.subscription_status ?? '';
  if (sub === 'active' || sub === 'active_paid' || sub === 'trialing') return true;
  if (profile.is_beta_tester !== true) return false;
  const expiresAt = profile.beta_expires_at;
  if (expiresAt == null) return true;
  try {
    const expiry = new Date(expiresAt);
    return !Number.isNaN(expiry.getTime()) && now < expiry;
  } catch {
    return true;
  }
}

/**
 * Days remaining until beta_expires_at (null if no expiry or not beta).
 * Used for expiration banner.
 */
export function getBetaDaysRemaining(
  profile: ProfileForAccess | null | undefined
): number | null {
  const expiresAt = profile?.beta_expires_at;
  if (expiresAt == null || !profile?.is_beta_tester) return null;
  try {
    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime())) return null;
    const now = new Date();
    if (now >= expiry) return 0;
    const ms = expiry.getTime() - now.getTime();
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }
}
