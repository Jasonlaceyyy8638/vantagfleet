import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { fetchIftaTripReport } from '@/lib/ifta-motive';

/**
 * GET /api/ifta/mileage?quarter=1&year=2026
 * Returns Motive mileage for the current user's org, grouped by state, for the given quarter.
 * Quarterly alignment: Q1 Jan 1–Mar 31, Q2 Apr 1–Jun 30, Q3 Jul 1–Sep 30, Q4 Oct 1–Dec 31.
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
  const quarter = Math.min(4, Math.max(1, Number(searchParams.get('quarter')) || 1)) as 1 | 2 | 3 | 4;
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  const result = await fetchIftaTripReport(orgId, year, quarter);

  if (result.error) {
    return NextResponse.json(
      { totalMiles: 0, milesByState: [], error: result.error },
      { status: 200 }
    );
  }

  return NextResponse.json({
    totalMiles: result.totalMiles,
    milesByState: result.milesByState,
  });
}
