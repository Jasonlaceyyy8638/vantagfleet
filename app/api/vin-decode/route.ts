import { NextRequest, NextResponse } from 'next/server';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues';

export type VinDecodeResponse =
  | {
      ok: true;
      year: string | null;
      make: string | null;
      model: string | null;
      weightClass: string | null;
      fuelType: string | null;
      gvwr: string | null;
      iftaEligible: boolean;
    }
  | { ok: false; error: string };

function trim(s: unknown): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t === '' ? null : t;
}

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get('vin')?.trim();
  if (!vin) {
    return NextResponse.json({ ok: false, error: 'VIN is required.' } as VinDecodeResponse, {
      status: 400,
    });
  }

  const url = `${NHTSA_BASE}/${encodeURIComponent(vin)}?format=json`;

  let res: Response;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('[vin-decode] Fetch failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not reach NHTSA. Try again later.' } as VinDecodeResponse,
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: 'Invalid VIN or vehicle not found.' } as VinDecodeResponse,
      { status: 200 }
    );
  }

  let data: {
    Count?: number;
    Results?: Array<{
      ErrorCode?: string;
      ModelYear?: string;
      Make?: string;
      Model?: string;
      GVWR?: string;
      FuelTypePrimary?: string;
    }>;
  };

  try {
    data = await res.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid VIN or vehicle not found.' } as VinDecodeResponse,
      { status: 200 }
    );
  }

  const result = data?.Results?.[0];
  const errorCode = trim(result?.ErrorCode);
  const success = errorCode === '0' || errorCode === '' || errorCode == null;

  if (!success || !result) {
    return NextResponse.json(
      { ok: false, error: 'Invalid VIN or vehicle not found.' } as VinDecodeResponse,
      { status: 200 }
    );
  }

  const modelYear = trim(result.ModelYear);
  const make = trim(result.Make);
  const model = trim(result.Model);
  const gvwr = trim(result.GVWR);
  const fuelType = trim(result.FuelTypePrimary);

  const hasData = modelYear || make || model || gvwr || fuelType;
  if (!hasData) {
    return NextResponse.json(
      { ok: false, error: 'Invalid VIN or vehicle not found.' } as VinDecodeResponse,
      { status: 200 }
    );
  }

  const iftaEligible = !!gvwr && /Class\s*8/i.test(gvwr);

  return NextResponse.json({
    ok: true,
    year: modelYear,
    make,
    model,
    weightClass: gvwr,
    fuelType,
    gvwr,
    iftaEligible,
  } as VinDecodeResponse);
}
