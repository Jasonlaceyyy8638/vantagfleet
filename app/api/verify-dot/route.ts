import { NextResponse } from 'next/server';

import { fetchCompanyData } from '@/services/fmcsa';

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

  const digits = dotNumber.replace(/\D/g, '');
  if (digits.length < 4) {
    return NextResponse.json({ error: 'Enter a valid DOT number.' }, { status: 400 });
  }

  try {
    const data = await fetchCompanyData(digits, 'dot');
    if (!data) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
    }

    const active = data.allowedToOperate === true;

    return NextResponse.json({
      ok: true,
      legalName: data.legalName,
      physicalAddress: data.physicalAddress,
      dot_number: data.dot_number,
      mc_number: data.mc_number,
      authorityType: data.authorityType,
      authority_type: data.authority_type,
      entity_type: data.authority_type,
      /** true when DOT Census (MCS-150) is current; does not imply BMC-91/BOC-3 or operating authority. */
      active,
      verificationScope: 'census',
    });
  } catch (err) {
    console.error('[verify-dot] Error:', err);
    return NextResponse.json({ error: 'Server Connection Failed' }, { status: 500 });
  }
}
