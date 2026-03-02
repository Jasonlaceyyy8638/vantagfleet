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
    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (res.status === 404) {
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: 404 }
      );
    }

    let data: {
      content?: {
        carrier?: {
          allowedToOperate?: string;
          allowToOperate?: string;
          legalName?: string;
        };
      };
    };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: 502 }
      );
    }

    const carrier = data?.content?.carrier;
    if (!carrier) {
      return NextResponse.json(
        { error: 'DOT number not found or not registered with FMCSA.' },
        { status: 404 }
      );
    }

    const allowed =
      carrier.allowedToOperate ?? carrier.allowToOperate;
    if (allowed === 'N') {
      return NextResponse.json(
        { error: 'This DOT is not authorized for operation.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      legalName: carrier.legalName ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
