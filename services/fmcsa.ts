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

/**
 * Fetches carrier data from FMCSA by USDOT number.
 * Requires FMCSA_WEBKEY or FMCSA_WEB_KEY in the environment.
 */
export async function fetchCarrierByUsdot(usdot: string): Promise<FmcsaCarrierData | null> {
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
