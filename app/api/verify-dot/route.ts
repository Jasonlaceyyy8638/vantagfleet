import { NextResponse } from 'next/server';

const FMCSA_BASE = 'https://mobile.fmcsa.dot.gov/qc/services/carriers';

/**
 * DOT verification uses the FMCSA QCMobile/Census API.
 *
 * IMPORTANT — "Ghost" DOT / MCS-150 vs operating authority:
 * - allowedToOperate: Y means the DOT Census record is current (MCS-150 biennial update filed).
 * - That does NOT guarantee the carrier can legally operate. Operating authority can be
 *   dismissed/revoked for missing Insurance (BMC-91) or Process Agents (BOC-3).
 * - This API does not reflect MC/operating authority status; it primarily reflects census.
 * - UI should clarify: we verify "DOT on file" / MCS-150 status, not full legal authority.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dotNumber = (url.searchParams.get('dotNumber') ?? url.searchParams.get('dot'))?.trim();

  const webKey = process.env.FMCSA_WEB_KEY?.trim() ?? process.env.FMCSA_WEBKEY?.trim();

  if (!dotNumber) {
    return NextResponse.json({ error: 'DOT number is required. Use ?dotNumber=1234567' }, { status: 400 });
  }

  if (!webKey) {
    return NextResponse.json(
      { error: 'DOT verification is not configured. Contact support.' },
      { status: 503 }
    );
  }

  try {
    const fmcsaUrl = `${FMCSA_BASE}/${encodeURIComponent(dotNumber)}?webKey=${encodeURIComponent(webKey)}`;
    const res = await fetch(fmcsaUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const is5xx = res.status >= 500;
      const message = is5xx
        ? 'The government DOT database is temporarily unavailable. Please try again in a few minutes.'
        : `FMCSA responded with ${res.status}. Try again later.`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    let data: { content?: { carrier?: { legalName?: string; allowedToOperate?: string } } };
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({ error: 'Invalid response from FMCSA' }, { status: 502 });
    }

    const carrier = data?.content?.carrier;

    if (!carrier) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      legalName: carrier.legalName ?? null,
      /** true when DOT Census (MCS-150) is current; does not imply BMC-91/BOC-3 or operating authority. */
      active: carrier.allowedToOperate === 'Y',
      verificationScope: 'census',
    });
  } catch (err) {
    console.error('[verify-dot] Error:', err);
    return NextResponse.json({ error: 'Server Connection Failed' }, { status: 500 });
  }
}
