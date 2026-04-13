import { NextResponse } from 'next/server';

import { fetchCompanyData } from '@/services/fmcsa';

/**
 * MC (docket) verification via FMCSA QCMobile — used on broker signup to prefill
 * legal name / address and surface broker-authority hints.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mcNumber = (url.searchParams.get('mcNumber') ?? url.searchParams.get('mc'))?.trim();

  if (!mcNumber) {
    return NextResponse.json({ error: 'MC number is required. Use ?mcNumber=123456' }, { status: 400 });
  }

  const webKey = process.env.FMCSA_WEB_KEY?.trim() ?? process.env.FMCSA_WEBKEY?.trim();
  if (!webKey) {
    return NextResponse.json(
      { error: 'MC verification is not configured. Contact support.' },
      { status: 503 }
    );
  }

  const digits = mcNumber.replace(/\D/g, '');
  if (digits.length < 4) {
    return NextResponse.json({ error: 'Enter at least 4 digits for the MC number.' }, { status: 400 });
  }

  try {
    const data = await fetchCompanyData(digits, 'mc');
    if (!data) {
      return NextResponse.json(
        { error: 'No carrier found for this MC number, or FMCSA lookup failed.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      legalName: data.legalName,
      physicalAddress: data.physicalAddress,
      authorityType: data.authorityType,
      authority_type: data.authority_type,
      entity_type: data.authority_type,
      dot_number: data.dot_number,
      mc_number: data.mc_number,
      allowedToOperate: data.allowedToOperate,
    });
  } catch (err) {
    console.error('[verify-mc] Error:', err);
    return NextResponse.json({ error: 'Server connection failed.' }, { status: 500 });
  }
}
