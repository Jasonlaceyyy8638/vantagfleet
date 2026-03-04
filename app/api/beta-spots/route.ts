import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BETA_CAP = 5;

/** Returns how many beta spots remain (first 5 users get is_beta_tester). Public, read-only. */
export async function GET() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (error) {
    return NextResponse.json({ remaining: 0 }, { status: 200 });
  }
  const total = count ?? 0;
  const remaining = Math.max(0, BETA_CAP - total);
  return NextResponse.json({ remaining, total: Math.min(total, BETA_CAP) });
}
