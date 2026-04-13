/**
 * FMCSA carrier lookup service.
 * Fetches carrier data from https://mobile.fmcsa.dot.gov/qc/services/carriers/
 * and can auto-populate organization (carrier) record with Legal Name, Address, and Safety Rating.
 */

const FMCSA_CARRIER_URL = 'https://mobile.fmcsa.dot.gov/qc/services/carriers';

export type FmcsaSafetyRating = 'Satisfactory' | 'Conditional' | 'Unsatisfactory' | 'None' | null;

export type FmcsaCarrierData = {
  legalName: string | null;
  address: string | null;
  safetyRating: FmcsaSafetyRating;
  allowedToOperate: boolean;
  dotNumber: string | null;
  /** Raw carrier object for extensibility */
  raw?: Record<string, unknown>;
};

function getWebKey(): string | null {
  return (
    (typeof process !== 'undefined' && process.env?.FMCSA_WEBKEY?.trim()) ||
    (typeof process !== 'undefined' && process.env?.FMCSA_WEB_KEY?.trim()) ||
    null
  );
}

function formatAddress(carrier: Record<string, unknown>): string | null {
  const phyStreet = (carrier.phyStreet as string)?.trim();
  const phyCity = (carrier.phyCity as string)?.trim();
  const phyState = (carrier.phyState as string)?.trim();
  const phyZip = (carrier.phyZip as string)?.trim();
  const phyCountry = (carrier.phyCountry as string)?.trim();
  if (!phyStreet && !phyCity && !phyState && !phyZip) return null;
  const parts = [phyStreet, [phyCity, phyState, phyZip].filter(Boolean).join(', '), phyCountry].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function parseSafetyRating(value: unknown): FmcsaSafetyRating {
  if (value == null) return null;
  const s = String(value).trim();
  if (['Satisfactory', 'Conditional', 'Unsatisfactory', 'None'].includes(s)) return s as FmcsaSafetyRating;
  return null;
}

async function fetchCarrierRawByDot(usdot: string): Promise<Record<string, unknown> | null> {
  const dot = String(usdot ?? '').trim();
  if (!dot) return null;

  const webKey = getWebKey();
  if (!webKey) {
    console.warn('[fmcsa] FMCSA_WEBKEY (or FMCSA_WEB_KEY) not set');
    return null;
  }

  const url = `${FMCSA_CARRIER_URL}/${encodeURIComponent(dot)}?webKey=${encodeURIComponent(webKey)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('[fmcsa] Fetch failed:', err);
    return null;
  }

  if (!res.ok) return null;

  let data: { content?: { carrier?: Record<string, unknown> } };
  try {
    data = await res.json();
  } catch {
    return null;
  }

  const carrier = data?.content?.carrier;
  if (!carrier || typeof carrier !== 'object') return null;
  return carrier as Record<string, unknown>;
}

/**
 * Fetches carrier data from FMCSA by USDOT number.
 * Requires FMCSA_WEBKEY or FMCSA_WEB_KEY in the environment.
 */
export async function fetchCarrierByUsdot(usdot: string): Promise<FmcsaCarrierData | null> {
  const dot = String(usdot ?? '').trim();
  if (!dot) return null;

  const carrier = await fetchCarrierRawByDot(dot);
  if (!carrier) return null;

  const legalName =
    (carrier.legalName as string)?.trim() ||
    (carrier.legal_name as string)?.trim() ||
    null;
  const address = formatAddress(carrier);
  const rawRating =
    carrier.safetyRating ?? carrier.rating ?? (carrier.SafetyRating as string);
  const safetyRating = parseSafetyRating(rawRating);
  const allowedToOperate = String(carrier.allowedToOperate ?? carrier.allowToOperate ?? '').toUpperCase() === 'Y';
  const dotNumber = (carrier.dotNumber as string)?.trim() ?? dot;

  return {
    legalName: legalName || null,
    address: address || null,
    safetyRating,
    allowedToOperate,
    dotNumber: dotNumber || null,
    raw: carrier as Record<string, unknown>,
  };
}

/** Authority classification for broker signup (FMCSA census + operation classification). */
export type FmcsaAuthorityType = 'Broker' | 'Carrier' | 'Other';

/** Canonical role for API / signup validation (matches `entity_type` / `authority_type` style). */
export type FmcsaAuthorityRole = 'BROKER' | 'CARRIER' | 'OTHER';

export function authorityTypeToRole(t: FmcsaAuthorityType): FmcsaAuthorityRole {
  if (t === 'Broker') return 'BROKER';
  if (t === 'Carrier') return 'CARRIER';
  return 'OTHER';
}

export type FmcsaCompanyData = {
  legalName: string | null;
  physicalAddress: string | null;
  authorityType: FmcsaAuthorityType;
  /** Uppercase role for clients (entity / operating authority classification). */
  authority_type: FmcsaAuthorityRole;
  /** USDOT from census (always returned when known). */
  dot_number: string | null;
  /** MC docket digits (search MC or extracted from DOT census / dockets). */
  mc_number: string | null;
  /** MCS-150 / census “allowed to operate” — set when present on carrier payload. */
  allowedToOperate: boolean | null;
};

function normalizeDigitString(value: unknown, minLen = 4): string | null {
  const d = String(value ?? '').replace(/\D/g, '');
  return d.length >= minLen ? d : null;
}

/**
 * Best-effort MC/FF docket digits from FMCSA carrier census (DOT lookup).
 */
export function extractMcNumberFromCarrier(carrier: Record<string, unknown>): string | null {
  const direct = [
    carrier.mcNumber,
    carrier.mc_number,
    carrier.docketNumber,
    carrier.docket_number,
    carrier.mcMxFfNumber,
    carrier.mcMxFf,
  ];
  for (const v of direct) {
    const n = normalizeDigitString(v);
    if (n) return n;
  }
  const arr = carrier.docketNumbers ?? carrier.dockets ?? carrier.mcNumbers;
  if (Array.isArray(arr)) {
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const t = String(o.docketType ?? o.type ?? '').toUpperCase();
      const num = normalizeDigitString(o.docketNumber ?? o.number ?? o.mcNumber);
      if (!num) continue;
      if (t === 'MC' || t === 'FF' || t === 'MX') return num;
    }
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const num = normalizeDigitString(o.docketNumber ?? o.number ?? o.mcNumber);
      if (num) return num;
    }
  }
  return null;
}

function extractCarrierFromDocketContent(data: unknown): Record<string, unknown> | null {
  const d = data as {
    content?: { carrier?: unknown; carriers?: unknown[]; carrierSearchResults?: unknown[] };
  };
  const c = d?.content?.carrier;
  if (c && typeof c === 'object') return c as Record<string, unknown>;
  const list = d?.content?.carriers ?? d?.content?.carrierSearchResults;
  if (Array.isArray(list) && list[0] && typeof list[0] === 'object') return list[0] as Record<string, unknown>;
  return null;
}

/** Heuristic: broker vs carrier vs unknown from census / docket payload. */
export function deriveAuthorityTypeFromCarrier(carrier: Record<string, unknown>): FmcsaAuthorityType {
  const entity = String(
    carrier.entityType ?? carrier.entity_type ?? carrier.carrierEntityType ?? carrier.entityTypeDesc ?? ''
  ).toUpperCase();
  if (entity.includes('BROKER')) return 'Broker';
  if (entity.includes('CARRIER') && !entity.includes('BROKER')) return 'Carrier';

  const authRaw = String(
    carrier.authorityType ?? carrier.authority_type ?? carrier.authorityTypeDesc ?? ''
  ).toUpperCase();
  if (authRaw.includes('BROKER')) return 'Broker';
  if (authRaw.includes('CARRIER') && !authRaw.includes('BROKER')) return 'Carrier';

  const op = String(carrier.carrierOperation ?? carrier.carrierCarrierOperation ?? '').toUpperCase();
  if (op.includes('BROKER')) return 'Broker';
  if (op.includes('CARRIER') || op.includes('FOR HIRE') || op.includes('FREIGHT') || op.includes('PROPERTY')) {
    if (!op.includes('BROKER')) return 'Carrier';
  }
  const hay = JSON.stringify(carrier).toUpperCase();
  if (hay.includes('BROKER AUTHORITY') || hay.includes('"BROKER"')) return 'Broker';
  return 'Other';
}

async function fetchOperationClassificationAuthority(dot: string): Promise<FmcsaAuthorityType> {
  const d = String(dot).trim();
  if (!d) return 'Other';
  const webKey = getWebKey();
  if (!webKey) return 'Other';
  const url = `${FMCSA_CARRIER_URL}/${encodeURIComponent(d)}/operation-classification?webKey=${encodeURIComponent(webKey)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return 'Other';
    const raw = await res.json();
    const text = JSON.stringify(raw).toUpperCase();
    if (/\bBROKER\b/.test(text) && !text.includes('NOT A BROKER')) return 'Broker';
    if (/\bCARRIER\b/.test(text) || text.includes('FOR HIRE')) return 'Carrier';
  } catch {
    return 'Other';
  }
  return 'Other';
}

function mergeAuthorityTypes(a: FmcsaAuthorityType, b: FmcsaAuthorityType): FmcsaAuthorityType {
  if (a === 'Broker' || b === 'Broker') return 'Broker';
  if (a === 'Carrier' || b === 'Carrier') return 'Carrier';
  return 'Other';
}

async function fetchCompanyDataByDocketDigits(mcDigits: string): Promise<FmcsaCompanyData | null> {
  const digits = String(mcDigits ?? '').replace(/\D/g, '');
  if (digits.length < 4) return null;

  const webKey = getWebKey();
  if (!webKey) {
    console.warn('[fmcsa] FMCSA_WEBKEY (or FMCSA_WEB_KEY) not set');
    return null;
  }

  const docketUrl = `${FMCSA_CARRIER_URL}/docket-number/${encodeURIComponent(digits)}?webKey=${encodeURIComponent(webKey)}`;
  let res: Response;
  try {
    res = await fetch(docketUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
  } catch (err) {
    console.error('[fmcsa] docket fetch failed:', err);
    return null;
  }

  if (!res.ok) return null;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return null;
  }

  const carrier = extractCarrierFromDocketContent(body);
  if (!carrier) return null;

  const legalName =
    String(carrier.legalName ?? carrier.legal_name ?? '').trim() || null;
  const physicalAddress = formatAddress(carrier);
  const dotRaw = (carrier.dotNumber ?? carrier.dot_number ?? '') as string | number | undefined;
  const dot_number =
    dotRaw != null && String(dotRaw).trim() !== '' ? String(dotRaw).replace(/\D/g, '') : null;

  const censusAuth = deriveAuthorityTypeFromCarrier(carrier);
  let opAuth: FmcsaAuthorityType = 'Other';
  if (dot_number) {
    opAuth = await fetchOperationClassificationAuthority(dot_number);
  }
  const authorityType = mergeAuthorityTypes(censusAuth, opAuth);

  const allowedToOperateRaw = String(carrier.allowedToOperate ?? carrier.allowToOperate ?? '').toUpperCase();
  const allowedToOperate =
    allowedToOperateRaw === 'Y' ? true : allowedToOperateRaw === 'N' ? false : null;

  return {
    legalName,
    physicalAddress,
    authorityType,
    authority_type: authorityTypeToRole(authorityType),
    dot_number,
    mc_number: digits,
    allowedToOperate,
  };
}

async function fetchCompanyDataByDot(dotInput: string): Promise<FmcsaCompanyData | null> {
  const dotDigits = String(dotInput ?? '').replace(/\D/g, '');
  if (dotDigits.length < 4) return null;

  const carrier = await fetchCarrierRawByDot(dotDigits);
  if (!carrier) return null;

  const legalName =
    String(carrier.legalName ?? carrier.legal_name ?? '').trim() || null;
  const physicalAddress = formatAddress(carrier);
  const dot_number =
    normalizeDigitString(carrier.dotNumber ?? carrier.dot_number, 4) ?? dotDigits;

  const mcExtracted = extractMcNumberFromCarrier(carrier);
  const mc_number = mcExtracted ?? null;

  const censusAuth = deriveAuthorityTypeFromCarrier(carrier);
  let opAuth: FmcsaAuthorityType = 'Other';
  if (dot_number) {
    opAuth = await fetchOperationClassificationAuthority(dot_number);
  }
  const authorityType = mergeAuthorityTypes(censusAuth, opAuth);

  const allowedToOperate = String(carrier.allowedToOperate ?? carrier.allowToOperate ?? '').toUpperCase() === 'Y';

  return {
    legalName,
    physicalAddress,
    authorityType,
    authority_type: authorityTypeToRole(authorityType),
    dot_number,
    mc_number,
    allowedToOperate,
  };
}

/**
 * FMCSA company census: lookup by MC docket or by USDOT. Always returns both identifiers when the API provides them.
 */
export async function fetchCompanyData(
  identifier: string,
  mode: 'mc' | 'dot'
): Promise<FmcsaCompanyData | null> {
  return mode === 'dot' ? fetchCompanyDataByDot(identifier) : fetchCompanyDataByDocketDigits(identifier);
}

export type PopulateOrganizationResult =
  | { ok: true; legalName: string | null; address: string | null; safetyRating: FmcsaSafetyRating }
  | { ok: false; error: string };

/**
 * Fetches FMCSA data for the given USDOT and updates the organization record
 * with Legal Name, Address, and Safety Rating. Use this after resolving org by usdot_number.
 */
export async function populateOrganizationFromFmcsa(
  updateOrg: (data: {
    legal_name: string | null;
    address: string | null;
    safety_rating: string | null;
  }) => Promise<{ error?: string }>,
  usdot: string
): Promise<PopulateOrganizationResult> {
  const data = await fetchCarrierByUsdot(usdot);
  if (!data) {
    return { ok: false, error: 'FMCSA carrier not found or lookup failed.' };
  }

  const { error } = await updateOrg({
    legal_name: data.legalName,
    address: data.address,
    safety_rating: data.safetyRating,
  });

  if (error) {
    return { ok: false, error };
  }

  return {
    ok: true,
    legalName: data.legalName,
    address: data.address,
    safetyRating: data.safetyRating,
  };
}
