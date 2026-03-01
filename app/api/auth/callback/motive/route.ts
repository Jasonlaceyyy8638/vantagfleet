import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MOTIVE_TOKEN_URL = 'https://api.gomotive.com/oauth/token';

/**
 * GET /api/auth/callback/motive?code=...&state=org_id
 * Exchanges code for access token and saves to carrier_integrations for the org.
 * Verifies the current user has access to the org before saving.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const baseUrl = appUrl.replace(/\/$/, '');

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=error&message=missing_params`);
  }

  const orgId = decodeURIComponent(state);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?redirect=${encodeURIComponent(request.url)}`);
  }

  // Ensure user belongs to this org
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  if (!orgIds.includes(orgId)) {
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=error&message=unauthorized`);
  }

  const clientId = process.env.MOTIVE_CLIENT_ID;
  const clientSecret = process.env.MOTIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=error&message=config`);
  }

  const redirectUri = `${baseUrl}/api/auth/callback/motive`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenRes = await fetch(MOTIVE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Motive token exchange failed:', tokenRes.status, errText);
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=error&message=exchange_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in ?? 7200;

  if (!accessToken) {
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=error&message=no_token`);
  }

  const credential = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken ?? null,
    expires_at: Date.now() + expiresIn * 1000,
  });

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('carrier_integrations')
      .select('id')
      .eq('org_id', orgId)
      .eq('provider', 'motive')
      .maybeSingle();

    if (existing) {
      await admin
        .from('carrier_integrations')
        .update({ credential, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await admin.from('carrier_integrations').insert({
        org_id: orgId,
        provider: 'motive',
        credential,
      });
    }
  } catch (e) {
    console.error('Save Motive token failed:', e);
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=error&message=save_failed`);
  }

  return NextResponse.redirect(`${baseUrl}/dashboard/integrations?motive=success`);
}
