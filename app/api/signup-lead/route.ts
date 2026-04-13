import { NextResponse } from 'next/server';

import { createSignupOrganization, type SignupAccountType } from '@/app/actions/auth';

/**
 * Public signup step: create organization with FMCSA-linked DOT / MC and optional address.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const accountType = body.accountType as SignupAccountType | undefined;
  if (accountType !== 'carrier' && accountType !== 'broker') {
    return NextResponse.json({ error: 'Invalid accountType' }, { status: 400 });
  }

  if (accountType === 'carrier') {
    const fleetRaw = body.fleetSize;
    const fleetSize =
      fleetRaw === null || fleetRaw === undefined || fleetRaw === ''
        ? null
        : Number(fleetRaw);
    const result = await createSignupOrganization('carrier', {
      companyName: String(body.companyName ?? ''),
      usdotNumber: String(body.usdotNumber ?? ''),
      fleetSize: fleetSize != null && !Number.isNaN(fleetSize) ? fleetSize : null,
      mcNumber: body.mcNumber != null ? String(body.mcNumber) : null,
      address: body.address != null ? String(body.address) : null,
    });
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  const result = await createSignupOrganization('broker', {
    brokerageName: String(body.brokerageName ?? ''),
    mcNumber: String(body.mcNumber ?? ''),
    usdotNumber: body.usdotNumber != null ? String(body.usdotNumber) : null,
    address: body.address != null ? String(body.address) : null,
  });
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
