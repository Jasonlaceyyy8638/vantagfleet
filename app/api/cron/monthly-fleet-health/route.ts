import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';
import { getFleetHealthForMonth } from '@/lib/monthly-fleet-health';
import { buildMonthlyFleetHealthEmail } from '@/lib/email-templates/monthly-fleet-health';
import { EMAIL_INFO } from '@/lib/email-addresses';

/** Previous month date range (first day 00:00 to last day 23:59). */
function getPreviousMonthRange(): { start: string; end: string; monthLabel: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const start = `${prev.y}-${String(prev.m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(prev.y, prev.m + 1, 0).getDate();
  const end = `${prev.y}-${String(prev.m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const monthLabel = new Date(prev.y, prev.m).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return { start, end, monthLabel };
}

/**
 * Cron: 1st of every month at 8:00 AM.
 * Sends Monthly Fleet Health Summary to org owners (Motive/Geotab connected).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { start, end, monthLabel } = getPreviousMonthRange();

  // Orgs that have at least one ELD integration (motive or geotab)
  const { data: integrations } = await admin
    .from('carrier_integrations')
    .select('org_id')
    .in('provider', ['motive', 'geotab']);
  const orgIds = Array.from(new Set((integrations ?? []).map((r) => (r as { org_id: string }).org_id).filter(Boolean)));

  let sent = 0;
  const errors: string[] = [];

  for (const orgId of orgIds) {
    try {
      const { data: org } = await admin
        .from('organizations')
        .select('name, legal_name')
        .eq('id', orgId)
        .single();
      const companyName =
        (org as { legal_name?: string } | null)?.legal_name ??
        (org as { name?: string })?.name ??
        'Your Fleet';

      let firstProfile: { user_id: string; full_name?: string } | null = null;
      const { data: ownerRow } = await admin
        .from('profiles')
        .select('user_id, full_name')
        .eq('org_id', orgId)
        .eq('role', 'Owner')
        .limit(1)
        .maybeSingle();
      if (ownerRow) firstProfile = ownerRow as { user_id: string; full_name?: string };
      if (!firstProfile) {
        const { data: anyRow } = await admin
          .from('profiles')
          .select('user_id, full_name')
          .eq('org_id', orgId)
          .limit(1)
          .maybeSingle();
        if (anyRow) firstProfile = anyRow as { user_id: string; full_name?: string };
      }
      if (!firstProfile?.user_id) {
        errors.push(`Org ${orgId}: no profile for email`);
        continue;
      }

      const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(firstProfile.user_id);
      if (authErr || !authUser?.user?.email) {
        errors.push(`Org ${orgId}: could not get user email`);
        continue;
      }

      const summary = await getFleetHealthForMonth(admin, orgId, start, end);
      const ownerName = (firstProfile.full_name || authUser.user.email?.split('@')[0] || 'Fleet Owner').trim();
      const { subject, text, html } = buildMonthlyFleetHealthEmail({
        ownerName,
        companyName,
        monthLabel,
        summary,
      });

      const result = await sendEmail({
        to: authUser.user.email,
        from: `VantagFleet <${EMAIL_INFO}>`,
        subject,
        text,
        html,
      });

      if (result.ok) sent++;
      else errors.push(`Org ${orgId}: ${result.error}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Org ${orgId}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: orgIds.length,
    monthLabel,
    errors: errors.length ? errors : undefined,
  });
}
