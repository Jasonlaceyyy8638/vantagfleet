/**
 * Single source of truth for IFTA/add-on access: true if user has paid (ifta_enabled)
 * OR is a first-5 beta tester (is_beta_tester).
 */
export function hasIftaAccess(iftaEnabled?: boolean, isBetaTester?: boolean): boolean {
  return Boolean(iftaEnabled || isBetaTester);
}

/**
 * Hook that returns true when the user has IFTA access (either ifta_enabled or is_beta_tester).
 * Use with profile data: useCheckAccess(profile?.ifta_enabled, profile?.is_beta_tester)
 */
export function useCheckAccess(iftaEnabled?: boolean, isBetaTester?: boolean): boolean {
  return hasIftaAccess(iftaEnabled, isBetaTester);
}
