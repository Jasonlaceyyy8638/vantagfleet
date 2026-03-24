import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BETA_FOUNDER_CAP } from '@/lib/beta-config';

export const dynamic = 'force-dynamic';

const BETA_CAP = BETA_FOUNDER_CAP;

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
};

/** Returns live count of beta testers (first N signups) and spots remaining. Public, read-only. */
export async function GET() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta_tester', true);
  if (error) {
    return NextResponse.json(
      { betaCount: 0, remaining: BETA_CAP, cap: BETA_CAP },
      { status: 200, headers: NO_CACHE }
    );
  }
  const betaCount = count ?? 0;
  const remaining = Math.max(0, BETA_CAP - betaCount);
  return NextResponse.json(
    { betaCount, remaining, cap: BETA_CAP },
    { status: 200, headers: NO_CACHE }
  );
}
