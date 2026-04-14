import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Single corporate admin allowlist for Vantag Control + /api/admin/*.
 * Server-side only — never trust client headers for authorization.
 */
export const DEFAULT_ADMIN_CONTROL_EMAIL = 'info@vantagfleet.com';

/** Alias for docs / imports that expect a constant name; default only — use getAdminControlEmail() for env override. */
export const ADMIN_CONTROL_EMAIL = DEFAULT_ADMIN_CONTROL_EMAIL;

/** Resolved allowlisted email (lowercase). Env ADMIN_CONTROL_EMAIL overrides default for staging/dev. */
export function getAdminControlEmail(): string {
  const raw = process.env.ADMIN_CONTROL_EMAIL?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT_ADMIN_CONTROL_EMAIL).toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === getAdminControlEmail();
}

/** Full access to Vantag Control UI and all /api/admin/* routes. */
export function canAccessVantagControlAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}

/**
 * Signed-in user only if their email matches the Vantag Control allowlist.
 * Use in server components and route handlers (after createClient).
 */
export async function getAdminUserOrNull(): Promise<{ user: User; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !canAccessVantagControlAdmin(user.email)) return null;
  return { user, email: user.email };
}

/** API routes: 401 if not signed in, 404 if signed in but not allowlisted (no route existence leak). */
export async function assertVantagControlAdmin(): Promise<
  { ok: true; user: User; email: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!canAccessVantagControlAdmin(user.email)) {
    return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  return { ok: true, user, email: user.email! };
}
