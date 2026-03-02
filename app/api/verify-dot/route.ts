import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dotNumber = searchParams.get('dotNumber');

  // Use the key directly for this test to rule out .env issues
  const webKey = '3f7deecba66a779b9d8d484b8ff95efdd3d9f40';

  if (!dotNumber) return NextResponse.json({ error: 'No DOT' }, { status: 400 });

  try {
    console.log(`[DEBUG] Fetching DOT: ${dotNumber}`);

    const response = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${webKey}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'VantagFleet-App', // Some gov APIs require a User-Agent
        },
      }
    );

    const text = await response.text(); // Get raw text first to see if it's even JSON
    console.log('[DEBUG] Raw Response:', text);

    const data = JSON.parse(text);
    const carrier = data?.content?.carrier;

    if (!carrier) {
      return NextResponse.json({ error: 'Not found in FMCSA' }, { status: 404 });
    }

    return NextResponse.json({
      legalName: carrier.legalName,
      status: carrier.allowedToOperate === 'Y' ? 'Active' : 'Inactive',
    });
  } catch (error) {
    console.error('[DEBUG] Fetch Failed:', error);
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}
