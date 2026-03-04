/**
 * Motive API service: locations, vehicles, trip logs, IFTA.
 * Uses MOTIVE_API_KEY from env when set; otherwise OAuth token per org from carrier_integrations.
 */

import { getMotiveToken } from '@/lib/motive-sync-core';

const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';

export type MotiveAuthSource = 'api_key' | 'oauth';

async function getAuthHeaders(orgId?: string): Promise<{ headers: Record<string, string>; source: MotiveAuthSource } | null> {
  const apiKey = process.env.MOTIVE_API_KEY?.trim();
  if (apiKey) {
    return { headers: { Authorization: `Bearer ${apiKey}` }, source: 'api_key' };
  }
  if (orgId) {
    const token = await getMotiveToken(orgId);
    if (token) return { headers: { Authorization: `Bearer ${token}` }, source: 'oauth' };
  }
  return null;
}

async function fetchMotive<T = unknown>(
  path: string,
  orgId?: string,
  opts?: { method?: string; searchParams?: Record<string, string> }
): Promise<{ data: T; source: MotiveAuthSource } | { error: string }> {
  const auth = await getAuthHeaders(orgId);
  if (!auth) {
    return { error: orgId ? 'Motive not connected. Connect in Integrations or set MOTIVE_API_KEY.' : 'MOTIVE_API_KEY not set.' };
  }

  const url = new URL(path, MOTIVE_API_BASE);
  if (opts?.searchParams) {
    Object.entries(opts.searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method: opts?.method ?? 'GET',
    headers: { ...auth.headers, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      error: res.status === 401
        ? 'Motive auth failed. Reconnect in Integrations or check MOTIVE_API_KEY.'
        : `Motive API error ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    return { error: 'Invalid JSON from Motive API.' };
  }
  return { data, source: auth.source };
}

// --- Locations (live GPS for map) ---

export type MotiveVehicleLocation = {
  id: string;
  latitude: number;
  longitude: number;
  vehicle_name?: string;
  number?: string;
  speed?: number;
  moving?: boolean;
  current_driver?: { first_name?: string; last_name?: string; name?: string };
  odometer?: number;
  [key: string]: unknown;
};

function normalizeLocationsList(raw: unknown): MotiveVehicleLocation[] {
  if (Array.isArray(raw)) return raw as MotiveVehicleLocation[];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.vehicle_locations)) return o.vehicle_locations as MotiveVehicleLocation[];
  if (Array.isArray(o.vehicles)) return o.vehicles as MotiveVehicleLocation[];
  if (Array.isArray(o.data)) return o.data as MotiveVehicleLocation[];
  return [];
}

export type FleetMapLocation = {
  id: string;
  lat: number;
  lng: number;
  vehicleName: string;
  driverName: string;
  speed: number | null;
  status: 'Moving' | 'Stationary';
  eta?: string | null;
  odometer?: number | null;
  orgId?: string;
  orgName?: string;
};

export async function getVehicleLocations(orgId?: string): Promise<FleetMapLocation[] | { error: string }> {
  const result = await fetchMotive<unknown>('/vehicle_locations', orgId);
  if ('error' in result) return result;

  const list = normalizeLocationsList(result.data);
  const out: FleetMapLocation[] = [];

  for (const v of list) {
    const lat = typeof v.latitude === 'number' ? v.latitude : (v as { lat?: number }).lat;
    const lng = typeof v.longitude === 'number' ? v.longitude : (v as { lon?: number }).lon;
    if (lat == null || lng == null) continue;

    const id = String((v as { vehicle_id?: string }).vehicle_id ?? (v as { id?: number }).id ?? `${lat}-${lng}`);
    const vehicleName = String(
      (v as { number?: string }).number ?? (v as { vehicle_name?: string }).vehicle_name ?? (v as { name?: string }).name ?? 'Vehicle'
    );
    const rawSpeed = (v as { speed?: number }).speed;
    const speed = typeof rawSpeed === 'number' ? rawSpeed : null;
    const moving =
      typeof (v as { moving?: boolean }).moving === 'boolean'
        ? (v as { moving: boolean }).moving
        : (v as { status?: string }).status === 'moving' || (speed != null && speed > 0);
    const driver = (v as { current_driver?: Record<string, unknown> }).current_driver ?? (v as { driver?: Record<string, unknown> }).driver;
    let driverName = '—';
    if (driver && typeof driver === 'object') {
      const d = driver as { first_name?: string; last_name?: string; name?: string };
      driverName = [d.first_name, d.last_name].filter(Boolean).join(' ') || d.name || '—';
    }
    const odometer = typeof (v as { odometer?: number }).odometer === 'number' ? (v as { odometer: number }).odometer : null;

    out.push({
      id,
      lat,
      lng,
      vehicleName,
      driverName,
      speed,
      status: moving ? 'Moving' : 'Stationary',
      ...(odometer != null ? { odometer } : {}),
    });
  }
  return out;
}

// --- Vehicles (for VIN matching) ---

export type MotiveVehicle = {
  id: number | string;
  number?: string;
  vin?: string;
  license_plate_state?: string;
  name?: string;
  [key: string]: unknown;
};

export async function getVehicles(orgId?: string): Promise<MotiveVehicle[] | { error: string }> {
  const result = await fetchMotive<unknown>('/vehicles', orgId);
  if ('error' in result) return result;

  const o = result.data as Record<string, unknown>;
  const list = Array.isArray(o.vehicles) ? o.vehicles : Array.isArray(o) ? result.data : [];
  return (list as MotiveVehicle[]).map((v) => ({
    id: v.id,
    number: v.number,
    vin: v.vin,
    license_plate_state: v.license_plate_state,
    name: v.name,
  }));
}

// --- IFTA / Trips (mileage by state, quarterly) ---

export type MotiveIftaRow = {
  jurisdiction?: string | null;
  state?: string | null;
  state_code?: string | null;
  distance?: string | number | null;
  miles?: number | null;
  metric_units?: boolean;
  [key: string]: unknown;
};

export type MilesByState = { state_code: string; miles: number }[];

function parseDistance(val: string | number | null | undefined, metricUnits?: boolean): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : Number(val);
  if (Number.isNaN(n)) return 0;
  return metricUnits ? n * 0.621371 : n;
}

function normalizeStateCode(jurisdiction: string | null | undefined): string | null {
  if (!jurisdiction || typeof jurisdiction !== 'string') return null;
  const s = jurisdiction.trim().toUpperCase();
  if (s.length === 2) return s;
  if (s.length > 2) return s.slice(0, 2);
  return null;
}

function aggregateIftaList(list: MotiveIftaRow[]): { milesByState: MilesByState; totalMiles: number } {
  const stateToMiles: Record<string, number> = {};
  let totalMiles = 0;
  for (const row of list) {
    const jurisdiction =
      row.jurisdiction ?? (row as { state?: string }).state ?? (row as { state_code?: string }).state_code;
    const stateCode = normalizeStateCode(jurisdiction);
    if (!stateCode) continue;
    const metricUnits = Boolean((row as { metric_units?: boolean }).metric_units);
    const distance = parseDistance(
      row.distance ?? (row as { miles?: number }).miles,
      metricUnits
    );
    if (distance <= 0) continue;
    stateToMiles[stateCode] = (stateToMiles[stateCode] ?? 0) + distance;
    totalMiles += distance;
  }
  const milesByState: MilesByState = Object.entries(stateToMiles)
    .map(([state_code, miles]) => ({ state_code, miles }))
    .sort((a, b) => b.miles - a.miles);
  return { milesByState, totalMiles };
}

function extractIftaList(data: unknown): MotiveIftaRow[] {
  if (Array.isArray(data)) return data as MotiveIftaRow[];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.data)) return d.data as MotiveIftaRow[];
  if (Array.isArray(d.summary)) return d.summary as MotiveIftaRow[];
  if (Array.isArray(d.trips)) return d.trips as MotiveIftaRow[];
  if (Array.isArray(d.vehicles)) return d.vehicles as MotiveIftaRow[];
  return [];
}

export async function getIftaSummary(
  orgId: string | undefined,
  startDate: string,
  endDate: string
): Promise<
  | { totalMiles: number; milesByState: MilesByState }
  | { error: string }
> {
  const result = await fetchMotive<unknown>('/ifta/summary', orgId, {
    searchParams: { start_date: startDate, end_date: endDate },
  });
  if ('error' in result) return result;

  const list = extractIftaList(result.data);
  if (list.length === 0) {
    const tripsResult = await fetchMotive<unknown>('/ifta/trips', orgId, {
      searchParams: { start_date: startDate, end_date: endDate },
    });
    if ('error' in tripsResult) return tripsResult;
    const tripsList = extractIftaList(tripsResult.data);
    const agg = aggregateIftaList(tripsList);
    return { totalMiles: agg.totalMiles, milesByState: agg.milesByState };
  }
  const agg = aggregateIftaList(list);
  return { totalMiles: agg.totalMiles, milesByState: agg.milesByState };
}

// --- Trip logs (for odometer / total miles) ---

export async function getIftaTrips(
  orgId: string | undefined,
  startDate: string,
  endDate: string
): Promise<{ totalMiles: number; milesByState: MilesByState } | { error: string }> {
  return getIftaSummary(orgId, startDate, endDate);
}

/** Total fleet miles for a date range (e.g. for profitability "miles this period"). */
export async function getFleetTotalMiles(
  orgId: string | undefined,
  startDate: string,
  endDate: string
): Promise<{ totalMiles: number } | { error: string }> {
  const result = await getIftaSummary(orgId, startDate, endDate);
  if ('error' in result) return result;
  return { totalMiles: result.totalMiles };
}

/** Check if Motive is available (API key or any org OAuth). */
export async function isMotiveAvailable(orgId?: string): Promise<boolean> {
  const auth = await getAuthHeaders(orgId);
  return auth !== null;
}
