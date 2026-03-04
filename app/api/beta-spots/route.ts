import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BETA_CAP = 5;

/** Returns count of existing beta testers and how many spots remain. Public, read-only. */
export async function GET() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta_tester', true);
  if (error) {
    return NextResponse.json({ betaCount: 0, remaining: BETA_CAP }, { status: 200 });
  }
  const betaCount = count ?? 0;
  const remaining = Math.max(0, BETA_CAP - betaCount);
  return NextResponse.json({ betaCount, remaining });
}
