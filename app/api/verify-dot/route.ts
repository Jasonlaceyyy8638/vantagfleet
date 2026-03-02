import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dotNumber = (searchParams.get('dotNumber') ?? searchParams.get('dot'))?.trim();
  const webKey = process.env.FMCSA_WEB_KEY?.trim() ?? process.env.FMCSA_WEBKEY?.trim();

  if (!dotNumber) {
    return NextResponse.json(
      { error: 'DOT number is required. Use ?dot=1234567 or ?dotNumber=1234567' },
      { status: 400 }
    );
  }

  if (!webKey) {
    return NextResponse.json(
      { error: 'DOT verification is not configured (FMCSA_WEB_KEY missing).' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(dotNumber)}?webKey=${encodeURIComponent(webKey)}`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    );

    const data = (await response.json()) as { content?: { carrier?: Record<string, unknown> } } | null;

    const carrier = data?.content?.carrier;

    if (!carrier) {
      console.log('FMCSA Response:', data);
      return NextResponse.json(
        { error: 'Carrier not found in FMCSA database' },
        { status: 404 }
      );
    }

    const legalName = (carrier.legalName as string) ?? null;
    const allowedToOperate = carrier.allowedToOperate as string | undefined;

    return NextResponse.json({
      ok: true,
      legalName,
      status: allowedToOperate === 'Y' ? 'Active' : 'Inactive',
      dotNumber: carrier.dotNumber ?? dotNumber,
      safetyRating: (carrier.safetyRating as string) ?? 'Not Rated',
    });
  } catch (error) {
    console.error('DOT Verification Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to FMCSA' },
      { status: 500 }
    );
  }
}
