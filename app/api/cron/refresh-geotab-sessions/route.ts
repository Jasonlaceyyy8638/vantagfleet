import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticate, probeSession, type GeotabCredentials } from '@/lib/geotab';
import { decryptGeotabPassword } from '@/lib/geotab-refresh';

/**
 * Cron: check stored Geotab sessions; if expired, re-authenticate using stored (encrypted) password and update sessionId.
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET>.
 * Requires GEOTAB_REFRESH_SECRET or CRON_SECRET to have been set when users connected (so passwordEncrypted is stored).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('carrier_integrations')
    .select('id, org_id, credential')
    .eq('provider', 'geotab');

  const list = rows ?? [];
  let refreshed = 0;
  const errors: string[] = [];

  for (const row of list) {
    const raw = (row as { credential?: string }).credential;
    if (!raw) continue;
    let cred: GeotabCredentials & { passwordEncrypted?: string };
    try {
      cred = JSON.parse(raw) as GeotabCredentials & { passwordEncrypted?: string };
    } catch {
      errors.push(`org ${(row as { org_id?: string }).org_id}: invalid credential JSON`);
      continue;
    }
    if (!cred.sessionId || !cred.userName || !cred.database || !cred.server) continue;
    if (!cred.passwordEncrypted) continue; // cannot refresh without stored password

    const probe = await probeSession(cred);
    if (probe.valid) continue;
    if (!('expired' in probe) || !probe.expired) {
      errors.push(`org ${(row as { org_id?: string }).org_id}: ${('error' in probe ? probe.error : 'unknown')}`);
      continue;
    }

    const password = decryptGeotabPassword(cred.passwordEncrypted);
    if (!password) {
      errors.push(`org ${(row as { org_id?: string }).org_id}: could not decrypt password (missing GEOTAB_REFRESH_SECRET?)`);
      continue;
    }

    const authResult = await authenticate(cred.server, cred.database, cred.userName, password);
    if ('error' in authResult) {
      errors.push(`org ${(row as { org_id?: string }).org_id}: re-auth failed: ${authResult.error}`);
      continue;
    }

    const updated = JSON.stringify({
      server: cred.server,
      database: cred.database,
      userName: cred.userName,
      sessionId: authResult.credentials.sessionId,
      passwordEncrypted: cred.passwordEncrypted,
    });
    const { error } = await admin
      .from('carrier_integrations')
      .update({
        credential: updated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (row as { id: string }).id);
    if (error) {
      errors.push(`org ${(row as { org_id?: string }).org_id}: ${error.message}`);
      continue;
    }
    refreshed++;
  }

  return NextResponse.json({
    ok: true,
    checked: list.length,
    refreshed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
