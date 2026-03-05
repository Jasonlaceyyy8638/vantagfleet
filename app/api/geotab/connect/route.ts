import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { authenticate } from '@/lib/geotab';
import { encryptGeotabPassword, canStoreGeotabPassword } from '@/lib/geotab-refresh';
import { sendEldSuccessEmail } from '@/lib/send-eld-success-email';

/**
 * POST /api/geotab/connect
 * Body: { server, database, userName, password }
 * Authenticates with Geotab, then stores credentials (server, database, userName, sessionId) in carrier_integrations.
 * Password is never stored.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return NextResponse.json({ error: 'No organization selected' }, { status: 400 });
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = (profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null);
  if (!orgIds.includes(orgId)) {
    return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 });
  }

  let body: { server?: string; database?: string; userName?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const server = (body.server ?? '').toString().trim() || 'my.geotab.com';
  const database = (body.database ?? '').toString().trim();
  const userName = (body.userName ?? '').toString().trim();
  const password = (body.password ?? '').toString();

  if (!userName || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  const authResult = await authenticate(server, database, userName, password);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 400 });
  }

  const { credentials } = authResult;
  const stored: Record<string, string> = {
    server: credentials.server,
    database: credentials.database,
    userName: credentials.userName,
    sessionId: credentials.sessionId,
  };
  if (canStoreGeotabPassword()) {
    const encrypted = encryptGeotabPassword(password);
    if (encrypted) stored.passwordEncrypted = encrypted;
  }
  const credentialJson = JSON.stringify(stored);

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('carrier_integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', 'geotab')
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('carrier_integrations')
      .update({
        credential: credentialJson,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    sendEldSuccessEmail(user.id, orgId, 'geotab').catch(() => {});
  } else {
    const { error } = await admin.from('carrier_integrations').insert({
      org_id: orgId,
      provider: 'geotab',
      credential: credentialJson,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  sendEldSuccessEmail(user.id, orgId, 'geotab').catch(() => {});

  return NextResponse.json({ ok: true });
}
