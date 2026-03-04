import { getMotiveToken } from '@/lib/motive-sync-core';

const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';

export type StateMiles = { state_code: string; miles: number };

/** Quarter boundaries (inclusive): Q1 Jan 1–Mar 31, Q2 Apr 1–Jun 30, Q3 Jul 1–Sep 30, Q4 Oct 1–Dec 31 */
export function getQuarterDateRange(
  year: number,
  quarter: 1 | 2 | 3 | 4
): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/** Raw row from Motive IFTA summary/trips (jurisdiction may be state code or name) */
type MotiveIftaRow = {
  jurisdiction?: string | null;
  distance?: string | number | null;
  [key: string]: unknown;
};

function parseDistance(val: string | number | null | undefined, metricUnits?: boolean): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : Number(val);
  if (Number.isNaN(n)) return 0;
  return metricUnits ? n * 0.621371 : n; // km -> miles
}

function normalizeStateCode(jurisdiction: string | null | undefined): string | null {
  if (!jurisdiction || typeof jurisdiction !== 'string') return null;
  const s = jurisdiction.trim().toUpperCase();
  if (s.length === 2) return s;
  if (s.length > 2) return s.slice(0, 2);
  return null;
}

/**
 * Fetches mileage from the Motive IFTA API for the given quarter and groups by state.
 * Uses v1/ifta/summary with start_date and end_date for quarterly alignment.
 */
export async function fetchMileageByStateAndQuarter(
  orgId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4
): Promise<{ totalMiles: number; milesByState: StateMiles[]; error?: string }> {
  const token = await getMotiveToken(orgId);
  if (!token) {
    return { totalMiles: 0, milesByState: [], error: 'Motive not connected for this organization.' };
  }

  const { start, end } = getQuarterDateRange(year, quarter);
  const url = new URL(`${MOTIVE_API_BASE}/ifta/summary`);
  url.searchParams.set('start_date', start);
  url.searchParams.set('end_date', end);

  function aggregateFromList(list: MotiveIftaRow[]): { stateToMiles: Record<string, number>; totalMiles: number } {
    const stateToMiles: Record<string, number> = {};
    let totalMiles = 0;
    for (const row of list) {
      const jurisdiction = row.jurisdiction ?? (row as { state?: string }).state ?? (row as { state_code?: string }).state_code;
      const stateCode = normalizeStateCode(jurisdiction);
      if (!stateCode) continue;
      const metricUnits = Boolean((row as { metric_units?: boolean }).metric_units);
      const distance = parseDistance(row.distance ?? (row as { miles?: number }).miles, metricUnits);
      if (distance <= 0) continue;
      stateToMiles[stateCode] = (stateToMiles[stateCode] ?? 0) + distance;
      totalMiles += distance;
    }
    return { stateToMiles, totalMiles };
  }

  function extractList(data: unknown): MotiveIftaRow[] {
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as MotiveIftaRow[];
    if (Array.isArray(d.summary)) return d.summary as MotiveIftaRow[];
    if (Array.isArray(d.vehicles)) return d.vehicles as MotiveIftaRow[];
    if (Array.isArray(d.trips)) return d.trips as MotiveIftaRow[];
    return [];
  }

  let stateToMiles: Record<string, number> = {};
  let totalMiles = 0;

  const summaryUrl = new URL(`${MOTIVE_API_BASE}/ifta/summary`);
  summaryUrl.searchParams.set('start_date', start);
  summaryUrl.searchParams.set('end_date', end);

  let res: Response;
  try {
    res = await fetch(summaryUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[ifta-motive] Fetch failed:', err);
    return { totalMiles: 0, milesByState: [], error: 'Failed to reach Motive API.' };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[ifta-motive] Motive API error:', res.status, text);
    return {
      totalMiles: 0,
      milesByState: [],
      error: res.status === 401 ? 'Motive token expired. Reconnect in Integrations.' : 'Motive API returned an error.',
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { totalMiles: 0, milesByState: [], error: 'Invalid response from Motive.' };
  }

  const summaryList = extractList(data);
  const aggregated = aggregateFromList(summaryList);
  stateToMiles = aggregated.stateToMiles;
  totalMiles = aggregated.totalMiles;

  if (summaryList.length === 0) {
    const tripsUrl = new URL(`${MOTIVE_API_BASE}/ifta/trips`);
    tripsUrl.searchParams.set('start_date', start);
    tripsUrl.searchParams.set('end_date', end);
    const tripsRes = await fetch(tripsUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (tripsRes.ok) {
      const tripsData = await tripsRes.json().catch(() => null);
      const tripsList = extractList(tripsData);
      const tripAgg = aggregateFromList(tripsList);
      if (tripAgg.totalMiles > 0) {
        stateToMiles = tripAgg.stateToMiles;
        totalMiles = tripAgg.totalMiles;
      }
    }
  }

  const milesByState: StateMiles[] = Object.entries(stateToMiles)
    .map(([state_code, miles]) => ({ state_code, miles }))
    .sort((a, b) => b.miles - a.miles);

  return { totalMiles, milesByState };
}

/**
 * Fetches the IFTA Trip Report from Motive for the selected quarter.
 * Returns a breakdown of miles per state (same as fetchMileageByStateAndQuarter).
 */
export async function fetchIftaTripReport(
  orgId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4
): Promise<{ totalMiles: number; milesByState: StateMiles[]; error?: string }> {
  return fetchMileageByStateAndQuarter(orgId, year, quarter);
}
