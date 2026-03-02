import { NextRequest, NextResponse } from 'next/server';
import { runExpiryAlerts } from '@/app/actions/send-expiry-alert';

/**
 * Cron endpoint: run the Automated Expiry Email Engine every morning (e.g. 8:00 AM).
 * Secure with CRON_SECRET: send Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runExpiryAlerts();

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
    errors: result.errors.length > 0 ? result.errors : undefined,
  });
}
