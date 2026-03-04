import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { fetchIftaTripReport } from '@/lib/ifta-motive';
import { calculateIfta } from '@/lib/ifta-calculate';
import { generateIftaPdf } from '@/lib/ifta-pdf';

/**
 * GET /api/ifta/pdf?quarter=1&year=2026
 * Generates IFTA return PDF for the current user's org: reconciled data, header from org, Total Balance Due.
 * Returns PDF file for download.
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

  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('name, legal_name, fein, ifta_account_number')
    .eq('id', orgId)
    .single();

  const legalName = (org as { legal_name?: string } | null)?.legal_name ?? (org as { name?: string })?.name ?? '—';
  const fein = (org as { fein?: string } | null)?.fein ?? '';
  const iftaAccountNumber = (org as { ifta_account_number?: string } | null)?.ifta_account_number ?? '';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const profileId = (profile as { id?: string } | null)?.id ?? null;

  let milesByState: { state_code: string; miles: number }[] = [];
  let totalMiles = 0;
  const mileageResult = await fetchIftaTripReport(orgId, year, quarter);
  if (!mileageResult.error) {
    milesByState = mileageResult.milesByState;
    totalMiles = mileageResult.totalMiles;
  }

  const gallonsByState: { state_code: string; gallons: number }[] = [];
  if (profileId) {
    const { data: receipts } = await admin
      .from('ifta_receipts')
      .select('state, gallons')
      .eq('user_id', profileId)
      .eq('quarter', quarter)
      .eq('year', year)
      .in('status', ['processed', 'verified']);
    const galMap: Record<string, number> = {};
    (receipts ?? []).forEach((r: { state?: string | null; gallons?: number | null }) => {
      const state = r.state?.trim().toUpperCase().slice(0, 2);
      if (!state) return;
      const g = Number(r.gallons) || 0;
      galMap[state] = (galMap[state] ?? 0) + g;
    });
    Object.entries(galMap).forEach(([state_code, gallons]) => {
      gallonsByState.push({ state_code, gallons });
    });
  }

  const iftaResult = calculateIfta(milesByState, gallonsByState, quarter, year);

  const pdfBytes = await generateIftaPdf(
    {
      legalName,
      fein,
      iftaAccountNumber,
      quarter,
      year,
      mpg: iftaResult.mpg,
    },
    iftaResult
  );

  const filename = `IFTA_Q${quarter}_${year}_Return.pdf`;
  const body = new Blob([pdfBytes], { type: 'application/pdf' });
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBytes.length),
    },
  });
}
