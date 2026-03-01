import { NextRequest, NextResponse } from 'next/server';

const MOTIVE_AUTH_URL = 'https://gomotive.com/oauth/authorize';

export async function GET(request: NextRequest) {
  const clientId = process.env.MOTIVE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (!clientId) {
    return NextResponse.json({ error: 'Motive OAuth not configured' }, { status: 500 });
  }
  const orgId = request.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }
  const base = appUrl.replace(/\/$/, '');
  const redirectUri = base + '/api/auth/callback/motive';
  const scope = 'freight_visibility.manage';
  const state = encodeURIComponent(orgId);
  const url = new URL(MOTIVE_AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  return NextResponse.redirect(url.toString());
}
