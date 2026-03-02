import { NextRequest, NextResponse } from 'next/server';

const FMCSA_CARRIER_URL = 'https://mobile.fmcsa.dot.gov/qc/services/carriers';

export async function GET(request: NextRequest) {
  const webKey = process.env.FMCSA_WEBKEY?.trim();
  if (!webKey) {
    return NextResponse.json(
      { error: 'DOT verification is not configured (FMCSA_WEBKEY missing).' },
      { status: 503 }
    );
  }

  const dot = request.nextUrl.searchParams.get('dot')?.trim();
  if (!dot) {
    return NextResponse.json(
      { error: 'DOT number is required. Use ?dot=1234567' },
      { status: 400 }
    );
  }

  try {
    const url = `${FMCSA_CARRIER_URL}/${encodeURIComponent(dot)}?webKey=${encodeURIComponent(webKey)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'DOT number not found or not registered with FMCSA.' },
          { status: 404 }
        );
      }
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { error: 'DOT verification is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: 502 }
      );
    }

    // FMCSA can return 200 with content as a string error message (e.g. "No results found")
    const content = (data as { content?: unknown }).content;
    if (typeof content === 'string') {
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: 404 }
      );
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { error: 'DOT verification is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    // content can be { carrier: {...} } or sometimes an array of one carrier
    let carrier = (content as { carrier?: Record<string, unknown> })?.carrier;
    if (!carrier && Array.isArray(content) && content[0]) {
      carrier = (content[0] as { carrier?: Record<string, unknown> })?.carrier;
    }
    if (!carrier || typeof carrier !== 'object') {
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: 404 }
      );
    }

    const allowed = (
      carrier.allowedToOperate ??
      carrier.allowToOperate ??
      (carrier as Record<string, unknown>).AllowedToOperate
    ) as string | undefined;
    if (allowed === 'N') {
      return NextResponse.json(
        { error: 'This DOT is not authorized for operation.' },
        { status: 400 }
      );
    }

    const legalNameRaw =
      (carrier.legalName as string | undefined) ??
      (carrier as Record<string, unknown>).LegalName;
    const legalName =
      legalNameRaw != null && String(legalNameRaw).trim()
        ? String(legalNameRaw).trim()
        : null;
    return NextResponse.json({
      ok: true,
      legalName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
