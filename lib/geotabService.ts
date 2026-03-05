/**
 * Geotab integration using the official mg-api-js SDK.
 * Use this for login + device fetch with clear error messages for the frontend.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GeotabApi = require('mg-api-js');

export type GeotabLoginCredentials = {
  server?: string;
  database: string;
  userName: string;
  password: string;
};

export type GeotabSessionCredentials = {
  server: string;
  database: string;
  userName: string;
  sessionId: string;
};

/** Credentials can be login (userName + password) or existing session (sessionId). */
export type GeotabCredentials = GeotabLoginCredentials | GeotabSessionCredentials;

function isSessionCreds(c: GeotabCredentials): c is GeotabSessionCredentials {
  return 'sessionId' in c && typeof (c as GeotabSessionCredentials).sessionId === 'string';
}

function normalizeServer(server: string | undefined): string {
  if (!server || !server.trim()) return 'my.geotab.com';
  const s = server.trim().toLowerCase();
  const withoutProtocol = s.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return withoutProtocol || 'my.geotab.com';
}

/**
 * Builds the authentication object expected by GeotabApi.
 * See mg-api-js README: credentials.database, userName, password (or sessionId), path = server.
 */
function buildAuth(credentials: GeotabCredentials): { credentials: Record<string, string>; path: string } {
  const server = normalizeServer('server' in credentials ? credentials.server : undefined);
  const base = {
    database: credentials.database.trim(),
    userName: credentials.userName.trim(),
  };
  if (isSessionCreds(credentials)) {
    return {
      credentials: { ...base, sessionId: credentials.sessionId },
      path: server,
    };
  }
  return {
    credentials: { ...base, password: credentials.password },
    path: server,
  };
}

/** Geotab API client interface (from mg-api-js). */
export type GeotabApiClient = {
  authenticate: () => Promise<unknown>;
  call: (method: string, params: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Returns an initialized GeotabApi client. Does not perform network calls;
 * authentication happens on first call (e.g. authenticate() or call('Get', ...)).
 */
export function getGeotabClient(credentials: GeotabCredentials): GeotabApiClient {
  const auth = buildAuth(credentials);
  const options = {
    rememberMe: false,
    timeout: 30,
  };
  return new GeotabApi(auth, options) as GeotabApiClient;
}

export type GeotabDeviceItem = {
  id: string;
  name?: string;
  serialNumber?: string;
  vehicleIdentificationNumber?: string;
  vin?: string;
  licensePlate?: string;
  comment?: string;
};

/** Raw Device from API may use vehicleIdentificationNumber; we expose vin for consistency. */
function toDeviceItem(raw: Record<string, unknown>): GeotabDeviceItem {
  const vin =
    (raw.vehicleIdentificationNumber as string) ??
    (raw.vin as string) ??
    (raw.VehicleIdentificationNumber as string) ??
    '';
  return {
    id: String(raw.id ?? ''),
    name: raw.name as string | undefined,
    serialNumber: (raw.serialNumber as string) ?? (raw.SerialNumber as string),
    vehicleIdentificationNumber: vin || undefined,
    vin: vin || undefined,
    licensePlate: (raw.licensePlate as string) ?? (raw.LicensePlate as string),
    comment: (raw.comment as string) ?? (raw.Comment as string),
  };
}

export type FetchGeotabDevicesResult =
  | { ok: true; devices: GeotabDeviceItem[] }
  | { ok: false; error: string };

/**
 * Logs in with the given credentials and returns all devices (vehicles) with their VINs.
 * Use this for "Connect Geotab" and "Sync Vehicles" flows.
 * Returns a clear error message for wrong password, wrong database, or network issues.
 */
export async function fetchGeotabDevices(credentials: GeotabCredentials): Promise<FetchGeotabDevicesResult> {
  const api = getGeotabClient(credentials);
  try {
    await api.authenticate();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const friendly = toFriendlyLoginError(message);
    return { ok: false, error: friendly };
  }
  try {
    const result = await api.call('Get', {
      typeName: 'Device',
      resultsLimit: 5000,
    });
    const list = Array.isArray(result) ? result : [];
    const devices = list.map((raw: Record<string, unknown>) => toDeviceItem(raw));
    return { ok: true, devices };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const friendly = toFriendlyLoginError(message);
    return { ok: false, error: friendly };
  }
}

/**
 * Maps Geotab API error messages to user-friendly strings for the frontend.
 */
function toFriendlyLoginError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invaliduser') || lower.includes('invalid user') || lower.includes('invaliduserexception')) {
    return 'Invalid username or password. Please check your credentials and try again.';
  }
  if (lower.includes('database') && (lower.includes('not found') || lower.includes('invalid') || lower.includes('unknown'))) {
    return 'Database not found. Please check your database name and server (e.g. my.geotab.com).';
  }
  if (lower.includes('session') && lower.includes('expir')) {
    return 'Your session has expired. Please sign in again with your username and password.';
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('network')) {
    return 'Connection timed out. Please check your internet connection and that the Geotab server is reachable.';
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Access denied. Please check your username and password.';
  }
  if (message.length > 200) {
    return `Geotab error: ${message.slice(0, 120)}…`;
  }
  return message || 'Unable to connect to Geotab. Please check your server, database, username and password.';
}
