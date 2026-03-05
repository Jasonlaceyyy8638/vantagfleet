import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { fetchIftaTripReport } from '@/lib/ifta-motive';
import { getFuelTaxDetails, type GeotabCredentials } from '@/lib/geotab';
import {
  generateAuditSummaryPdf,
  generateAuditTripLogPdf,
  type AuditSummaryRow,
  type AuditTripLogRow,
} from '@/lib/ifta-audit-pdf';
import JSZip from 'jszip';

function getQuarterDateRange(year: number, quarter: 1 | 2 | 3 | 4): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/** Sanitize company name for use in filename (no slashes, backslashes, colons). */
function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'Company';
}

/**
 * GET /api/ifta/audit-export?quarter=1&year=2024
 * Returns a ZIP containing:
 * - IFTA_Audit_Summary_Q1_2024.pdf
 * - IFTA_Trip_Log_Q1_2024.pdf
 * Filename: VantagFleet_Audit_[CompanyName]_Q1_2024.zip
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

  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('name, legal_name, usdot_number')
    .eq('id', orgId)
    .single();

  const companyName =
    (org as { legal_name?: string } | null)?.legal_name ??
    (org as { name?: string })?.name ??
    'Company';
  const dotNumber = (org as { usdot_number?: string | null } | null)?.usdot_number ?? '—';
  const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const profileId = (profile as { id?: string } | null)?.id ?? null;

  // Miles by state (Motive first, then Geotab)
  let milesByState: { state_code: string; miles: number }[] = [];
  const mileageResult = await fetchIftaTripReport(orgId, year, quarter);
  if (!mileageResult.error) {
    milesByState = mileageResult.milesByState;
  } else {
    const { data: geotabRow } = await admin
      .from('carrier_integrations')
      .select('credential')
      .eq('org_id', orgId)
      .eq('provider', 'geotab')
      .maybeSingle();
    const cred = (geotabRow as { credential?: string } | null)?.credential
      ? (JSON.parse((geotabRow as { credential: string }).credential) as GeotabCredentials)
      : null;
    if (cred?.sessionId) {
      const geotabResult = await getFuelTaxDetails(cred, start, end);
      if (!('error' in geotabResult)) {
        const byState = new Map<string, number>();
        for (const d of geotabResult.details) {
          const state = (d.jurisdiction ?? '').toString().trim().toUpperCase().slice(0, 2);
          const miles = Number((d as { distance?: number }).distance ?? (d as { odometer?: number }).odometer ?? 0);
          if (state && miles > 0) {
            byState.set(state, (byState.get(state) ?? 0) + miles);
          }
        }
        milesByState = Array.from(byState.entries())
          .map(([state_code, miles]) => ({ state_code, miles }))
          .sort((a, b) => a.state_code.localeCompare(b.state_code));
      }
    }
  }

  // Fuel by state (ifta_receipts)
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

  const allStates = Array.from(
    new Set([...milesByState.map((m) => m.state_code), ...gallonsByState.map((g) => g.state_code)])
  ).sort();
  const gallonsMap = new Map(gallonsByState.map((g) => [g.state_code, g.gallons]));
  const milesMap = new Map(milesByState.map((m) => [m.state_code, m.miles]));

  const summaryRows: AuditSummaryRow[] = allStates.map((state_code) => ({
    state_code,
    taxableMiles: milesMap.get(state_code) ?? 0,
    fuelPurchases: gallonsMap.get(state_code) ?? 0,
  }));

  // Trip log: from Geotab FuelTaxDetail when available
  let tripLogRows: AuditTripLogRow[] = [];
  const { data: geotabRow } = await admin
    .from('carrier_integrations')
    .select('credential')
    .eq('org_id', orgId)
    .eq('provider', 'geotab')
    .maybeSingle();
  const cred = (geotabRow as { credential?: string } | null)?.credential
    ? (JSON.parse((geotabRow as { credential: string }).credential) as GeotabCredentials)
    : null;
  if (cred?.sessionId) {
    const geotabResult = await getFuelTaxDetails(cred, start, end);
    if (!('error' in geotabResult)) {
      tripLogRows = geotabResult.details.map((d) => {
        const state = (d.jurisdiction ?? '').toString().trim().toUpperCase().slice(0, 2) || '—';
        const enter = d.enterTime ? new Date(d.enterTime).toISOString().replace('T', ' ').slice(0, 19) : '—';
        const exit = d.exitTime ? new Date(d.exitTime).toISOString().replace('T', ' ').slice(0, 19) : '—';
        const distance = Number((d as { distance?: number }).distance ?? (d as { odometer?: number }).odometer ?? 0);
        return { state, enterTime: enter, exitTime: exit, distance };
      });
    }
  }

  const auditPdfOptions = { dotNumber, exportDate };
  const summaryPdf = await generateAuditSummaryPdf(companyName, quarter, year, summaryRows, auditPdfOptions);
  const tripLogPdf = await generateAuditTripLogPdf(companyName, quarter, year, tripLogRows, auditPdfOptions);

  const zip = new JSZip();
  zip.file(`IFTA_Audit_Summary_Q${quarter}_${year}.pdf`, summaryPdf, { binary: true });
  zip.file(`IFTA_Trip_Log_Q${quarter}_${year}.pdf`, tripLogPdf, { binary: true });

  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  const safeName = sanitizeFileName(companyName);
  const zipFilename = `VantagFleet_Audit_${safeName}_Q${quarter}_${year}.zip`;
  const body = new Blob([zipBytes as BlobPart], { type: 'application/zip' });

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFilename}"`,
      'Content-Length': String(zipBytes.length),
    },
  });
}
