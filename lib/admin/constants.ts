/**
 * Vantag Control allowlist and helpers (Next.js App Router + Supabase Auth).
 * Server-side: use getAdminControlEmail() — ADMIN_CONTROL_EMAIL env overrides default.
 */
export {
  ADMIN_CONTROL_EMAIL,
  DEFAULT_ADMIN_CONTROL_EMAIL,
  getAdminControlEmail,
  isAdminEmail,
  canAccessVantagControlAdmin,
  getAdminUserOrNull,
  assertVantagControlAdmin,
} from './control-access';
