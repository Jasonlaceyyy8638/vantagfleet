import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { getIftaSummary } from '@/lib/motive';
import { getFuelTaxDetails, aggregateFuelTaxByState, type GeotabCredentials } from '@/lib/geotab';

function getQuarterDateRange(year: number, quarter: 1 | 2 | 3 | 4): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/**
 * GET /api/ifta/mileage?quarter=1&year=2026
 * Returns ELD mileage (Motive or Geotab) for the current user's org, grouped by state.
 * Tries Motive first; if not connected or error, falls back to Geotab FuelTaxDetail.
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
  const { start, end } = getQuarterDateRange(year, quarter);

  let result = await getIftaSummary(orgId, start, end);

  if ('error' in result) {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('carrier_integrations')
      .select('credential')
      .eq('org_id', orgId)
      .eq('provider', 'geotab')
      .maybeSingle();
    const cred = (row as { credential?: string } | null)?.credential
      ? (JSON.parse((row as { credential: string }).credential) as GeotabCredentials)
      : null;
    if (cred?.sessionId) {
      const geotabResult = await getFuelTaxDetails(cred, start, end);
      if (!('error' in geotabResult)) {
        const agg = aggregateFuelTaxByState(geotabResult.details);
        result = { totalMiles: agg.totalMiles, milesByState: agg.milesByState };
      }
    }
  }

  if ('error' in result) {
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
