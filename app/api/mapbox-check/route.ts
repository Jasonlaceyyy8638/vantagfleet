import { NextResponse } from 'next/server';

/**
 * Server-side check: does Mapbox accept the token in .env.local?
 * GET /api/mapbox-check — returns { ok, status, message }.
 * Use this to confirm whether 401 is from an invalid token or from client/env.
 */
export async function GET() {
  const token = (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '').trim();
  const tokenType = token.startsWith('pk.') ? 'public' : token.startsWith('sk.') ? 'secret' : 'unknown';
  if (!token) {
    return NextResponse.json({
      ok: false,
      status: 0,
      message: 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing or empty in .env.local',
      tokenType,
    });
  }
  if (tokenType === 'secret') {
    return NextResponse.json({
      ok: false,
      status: 401,
      message: 'Secret tokens (sk.) cannot be used in the browser. In Mapbox → Access tokens, copy the Default public token (starts with pk.) into .env.local.',
      tokenType,
      tokenPrefix: token.slice(0, 10) + '…',
    });
  }
  const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(styleUrl);
    const ok = res.ok;
    const status = res.status;
    let message = ok
      ? 'Token is valid for server requests. If the map still shows 401 in the browser, use the Default public token (pk.) and ensure it has Public scope for browser use.'
      : `Mapbox returned ${status}. Token may be invalid, expired, or from a different account.`;
    return NextResponse.json({
      ok,
      status,
      message,
      tokenType,
      tokenPrefix: token.slice(0, 10) + '…',
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : 'Request failed',
      tokenType,
    });
  }
}
