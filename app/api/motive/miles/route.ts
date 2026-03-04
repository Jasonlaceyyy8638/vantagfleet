import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { getFleetTotalMiles } from '@/lib/motive';

/**
 * GET /api/motive/miles?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns total fleet miles from Motive for the date range (e.g. for Profitability Calculator).
 * Uses MOTIVE_API_KEY or OAuth.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return NextResponse.json({ error: 'No organization selected' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const startStr = searchParams.get('start') ?? start.toISOString().slice(0, 10);
  const endStr = searchParams.get('end') ?? end.toISOString().slice(0, 10);

  const result = await getFleetTotalMiles(orgId, startStr, endStr);

  if ('error' in result) {
    return NextResponse.json({ totalMiles: null, error: result.error }, { status: 200 });
  }

  return NextResponse.json({ totalMiles: result.totalMiles });
}
