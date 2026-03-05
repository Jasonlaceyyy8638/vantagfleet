/**
 * Geotab MyGeotab API integration.
 * Uses JSON-RPC over HTTPS. Authenticate returns credentials (sessionId); store and use for Get<Device>, Get<FuelTaxDetail>.
 */

export type GeotabCredentials = {
  server: string;
  database: string;
  userName: string;
  sessionId: string;
};

function normalizeServer(server: string): string {
  const s = server.trim().toLowerCase();
  if (!s) return 'my.geotab.com';
  if (!s.startsWith('http')) return s.replace(/\/+$/, '');
  try {
    const u = new URL(s);
    return u.hostname || 'my.geotab.com';
  } catch {
    return s.replace(/^https?:\/\//, '').replace(/\/+$/, '') || 'my.geotab.com';
  }
}

function getApiUrl(server: string): string {
  const host = normalizeServer(server);
  return `https://${host}/apiv1`;
}

/** JSON-RPC request to Geotab. */
async function callGeotab<T>(
  apiUrl: string,
  method: string,
  params: Record<string, unknown>
): Promise<{ result: T } | { error: { message?: string } }> {
  const body = JSON.stringify({
    method,
    params: params,
  });
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as {
    result?: T;
    error?: { message?: string; data?: unknown };
  };
  if (!res.ok) {
    return { error: { message: json.error?.message ?? `HTTP ${res.status}` } };
  }
  if (json.error) {
    return { error: { message: json.error.message ?? 'Geotab API error' } };
  }
  return { result: json.result as T };
}

/** Check if the stored session is still valid. Uses a lightweight Get call. */
export async function probeSession(
  cred: GeotabCredentials
): Promise<{ valid: true } | { expired: true } | { error: string }> {
  const apiUrl = getApiUrl(cred.server);
  const out = await callGeotab<unknown[]>(apiUrl, 'Get', {
    typeName: 'Device',
    credentials: {
      database: cred.database,
      userName: cred.userName,
      sessionId: cred.sessionId,
    },
    resultsLimit: 1,
  });
  if ('result' in out) {
    return { valid: true };
  }
  const msg = (out.error?.message ?? '').toLowerCase();
  if (msg.includes('session') && (msg.includes('expir') || msg.includes('invalid'))) {
    return { expired: true };
  }
  return { error: out.error?.message ?? 'Unknown error' };
}

/**
 * Authenticate with Geotab. Returns credentials (including sessionId) for subsequent API calls.
 * Do not store password; sessionId expires (e.g. after days) and user must reconnect.
 */
export async function authenticate(
  server: string,
  database: string,
  userName: string,
  password: string
): Promise<{ credentials: GeotabCredentials } | { error: string }> {
  const apiUrl = getApiUrl(server);
  const params: Record<string, unknown> = {
    database: database.trim() || undefined,
    userName: userName.trim(),
    password,
  };
  const out = await callGeotab<{ credentials: GeotabCredentials }>(
    apiUrl,
    'Authenticate',
    params
  );
  if ('error' in out) {
    return { error: out.error.message ?? 'Authentication failed' };
  }
  const cred = out.result?.credentials;
  if (!cred?.sessionId || !cred.database || !cred.userName) {
    return { error: 'Invalid response from Geotab' };
  }
  return {
    credentials: {
      server: normalizeServer(server),
      database: cred.database,
      userName: cred.userName,
      sessionId: cred.sessionId,
    },
  };
}

export type GeotabDevice = {
  id: string;
  name?: string;
  serialNumber?: string;
  deviceType?: string;
  vin?: string;
  licensePlate?: string;
  comment?: string;
};

/** Get all devices (vehicles). Map to our vehicles table by VIN. */
export async function getDevices(
  cred: GeotabCredentials
): Promise<{ devices: GeotabDevice[] } | { error: string }> {
  const apiUrl = getApiUrl(cred.server);
  const out = await callGeotab<GeotabDevice[]>(apiUrl, 'Get', {
    typeName: 'Device',
    credentials: {
      database: cred.database,
      userName: cred.userName,
      sessionId: cred.sessionId,
    },
  });
  if ('error' in out) {
    return { error: out.error.message ?? 'Failed to get devices' };
  }
  const list = Array.isArray(out.result) ? out.result : [];
  const devices = list.map((d) => {
    const raw = d as { id?: string | number; name?: string; serialNumber?: string; deviceType?: string; vin?: string; licensePlate?: string; comment?: string };
    return {
    id: String(raw.id ?? ''),
    name: raw.name,
    serialNumber: raw.serialNumber,
    deviceType: raw.deviceType,
    vin: raw.vin,
    licensePlate: raw.licensePlate,
    comment: raw.comment,
  };
  });
  return { devices };
}

export type GeotabFuelTaxDetail = {
  id?: string;
  device?: { id: string };
  driver?: { id: string };
  jurisdiction?: string; // state/province code
  enterTime?: string;
  exitTime?: string;
  odometer?: number;
  distance?: number;
  [key: string]: unknown;
};

/** Get FuelTaxDetail records for IFTA state-crossing mileage. fromDate/toDate in ISO format. */
export async function getFuelTaxDetails(
  cred: GeotabCredentials,
  fromDate: string,
  toDate: string
): Promise<{ details: GeotabFuelTaxDetail[] } | { error: string }> {
  const apiUrl = getApiUrl(cred.server);
  const search: Record<string, unknown> = {
    FromDate: fromDate,
    ToDate: toDate,
  };
  const out = await callGeotab<GeotabFuelTaxDetail[]>(apiUrl, 'Get', {
    typeName: 'FuelTaxDetail',
    search,
    credentials: {
      database: cred.database,
      userName: cred.userName,
      sessionId: cred.sessionId,
    },
  });
  if ('error' in out) {
    return { error: out.error.message ?? 'Failed to get fuel tax details' };
  }
  const list = Array.isArray(out.result) ? out.result : [];
  return { details: list };
}

/** Aggregate FuelTaxDetail by jurisdiction (state) for IFTA mileage summary. */
export function aggregateFuelTaxByState(
  details: GeotabFuelTaxDetail[]
): { totalMiles: number; milesByState: { state_code: string; miles: number }[] } {
  const byState = new Map<string, number>();
  let totalMiles = 0;
  for (const d of details) {
    const state = (d.jurisdiction ?? '').toString().trim().toUpperCase().slice(0, 2);
    const miles = Number((d as { distance?: number }).distance ?? (d as { odometer?: number }).odometer ?? 0);
    if (state && miles > 0) {
      byState.set(state, (byState.get(state) ?? 0) + miles);
      totalMiles += miles;
    }
  }
  const milesByState = Array.from(byState.entries())
    .map(([state_code, miles]) => ({ state_code, miles }))
    .sort((a, b) => a.state_code.localeCompare(b.state_code));
  return { totalMiles, milesByState };
}

/** Map-friendly location (same shape as Motive FleetMapLocation). */
export type GeotabMapLocation = {
  id: string;
  lat: number;
  lng: number;
  vehicleName: string;
  driverName: string;
  speed: number | null;
  status: 'Moving' | 'Stationary';
};

type LogRecordRow = {
  device?: { id: string };
  latitude?: number;
  longitude?: number;
  dateTime?: string;
  speed?: number;
  [key: string]: unknown;
};

/** Fetch recent device positions from Geotab LogRecord for the live map. */
export async function getDeviceLocations(
  cred: GeotabCredentials
): Promise<{ locations: GeotabMapLocation[] } | { error: string }> {
  const apiUrl = getApiUrl(cred.server);
  const now = new Date();
  const toDate = now.toISOString();
  const fromDate = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const out = await callGeotab<LogRecordRow[]>(apiUrl, 'Get', {
    typeName: 'LogRecord',
    search: { FromDate: fromDate, ToDate: toDate },
    credentials: {
      database: cred.database,
      userName: cred.userName,
      sessionId: cred.sessionId,
    },
    resultsLimit: 5000,
  });
  if ('error' in out) {
    return { error: out.error.message ?? 'Failed to get locations' };
  }
  const list = Array.isArray(out.result) ? out.result : [];
  const byDevice = new Map<string, LogRecordRow>();
  for (const row of list) {
    const devId = row.device?.id != null ? String(row.device.id) : '';
    const lat = typeof row.latitude === 'number' ? row.latitude : null;
    const lng = typeof row.longitude === 'number' ? row.longitude : null;
    if (!devId || lat == null || lng == null) continue;
    const existing = byDevice.get(devId);
    if (!existing || (row.dateTime != null && String(row.dateTime) > String(existing.dateTime ?? ''))) {
      byDevice.set(devId, row);
    }
  }
  const locations: GeotabMapLocation[] = [];
  for (const [devId, row] of Array.from(byDevice.entries())) {
    const lat = typeof row.latitude === 'number' ? row.latitude : 0;
    const lng = typeof row.longitude === 'number' ? row.longitude : 0;
    const speed = typeof row.speed === 'number' ? row.speed : null;
    locations.push({
      id: `geotab-${devId}`,
      lat,
      lng,
      vehicleName: `Vehicle ${devId.slice(-6)}`,
      driverName: '—',
      speed,
      status: speed != null && speed > 0 ? 'Moving' : 'Stationary',
    });
  }
  return { locations };
}

