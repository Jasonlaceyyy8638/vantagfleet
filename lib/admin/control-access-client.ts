/**
 * Client-only helper for nav visibility. Server routes must use `canAccessVantagControlAdmin` from
 * `./control-access`. Optional NEXT_PUBLIC_ADMIN_CONTROL_EMAIL must match ADMIN_CONTROL_EMAIL in env.
 */
const DEFAULT = 'info@vantagfleet.com';

function allowedEmailLower(): string {
  const raw =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ADMIN_CONTROL_EMAIL?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT).toLowerCase();
}

/** True when the signed-in user should see the Vantag Control nav link (UX only; server still enforces). */
export function isVantagControlNavAdmin(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === allowedEmailLower();
}
