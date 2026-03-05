import { NextResponse } from 'next/server';

/**
 * Returns the Mapbox token from server env so the client always gets the current value
 * (avoids stale token from Next.js inlining at build time).
 */
export async function GET() {
  const token = (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '').trim();
  return NextResponse.json({ token });
}
