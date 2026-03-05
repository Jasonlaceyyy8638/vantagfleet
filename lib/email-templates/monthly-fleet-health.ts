/**
 * Monthly Fleet Health Report email template.
 * Sender: info@vantagfleet.com. Executive summary style with CTA and legal footer.
 */

import type { FleetHealthSummary } from '@/lib/monthly-fleet-health';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  'https://vantagfleet.com';

export function buildMonthlyFleetHealthEmail(params: {
  ownerName: string;
  companyName: string;
  monthLabel: string; // e.g. "February 2026"
  summary: FleetHealthSummary;
}): { subject: string; text: string; html: string } {
  const { ownerName, companyName, monthLabel, summary } = params;
  const firstName = ownerName.split(/\s+/)[0] || 'there';
  const totalMilesFormatted = summary.totalMiles.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const top3List =
    summary.top3States.length > 0
      ? summary.top3States.map((s) => `${s.state_code}: ${s.miles.toLocaleString()} mi`).join(' · ')
      : 'No ELD data for this period';

  const subject = `📊 ${monthLabel} Fleet Health Report - ${companyName}`;

  const text = [
    `Hi ${firstName},`,
    '',
    `Here is how your fleet performed in ${monthLabel}.`,
    '',
    `Total Fleet Miles: ${totalMilesFormatted}`,
    `Top 3 States (IFTA): ${top3List}`,
    `ELD Sync: ${summary.eldSyncHealth}`,
    summary.fuelVsMilesText !== 'No fuel data' ? `Fuel vs Miles: ${summary.fuelVsMilesText}` : '',
    '',
    'View Full IFTA Dashboard: ' + BASE_URL + '/dashboard/ifta',
    '',
    '---',
    `Your Audit-Ready ZIP for ${monthLabel} is now available for export in your dashboard.`,
    '',
    'Privacy Policy: ' + BASE_URL + '/privacy',
    'Terms of Service: ' + BASE_URL + '/terms',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${monthLabel} Fleet Health Report</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 32px 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #334155;">
        Hi ${escapeHtml(firstName)},
      </p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #334155;">
        Here is how your fleet performed in <strong>${escapeHtml(monthLabel)}</strong>.
      </p>

      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.7);">Total Fleet Miles</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #fbbf24;">${escapeHtml(totalMilesFormatted)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Top 3 states (IFTA)</td>
          <td style="padding: 10px 0; font-size: 14px; color: #334155; font-weight: 500;">${escapeHtml(top3List)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #64748b;">ELD sync health</td>
          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${escapeHtml(summary.eldSyncHealth)}</td>
        </tr>
        ${summary.fuelVsMilesText !== 'No fuel data' ? `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Fuel vs miles</td>
          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${escapeHtml(summary.fuelVsMilesText)}</td>
        </tr>
        ` : ''}
      </table>

      <p style="margin: 0 0 24px; text-align: center;">
        <a href="${BASE_URL}/dashboard/ifta" style="display: inline-block; padding: 14px 28px; background: #f59e0b; color: #0f172a; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 15px;">View Full IFTA Dashboard</a>
      </p>

      <p style="margin: 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        Your Audit-Ready ZIP for <strong>${escapeHtml(monthLabel)}</strong> is now available for export in your dashboard.
      </p>
    </div>

    <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
      <a href="${BASE_URL}/privacy" style="color: #94a3b8;">Privacy Policy</a>
      &nbsp;·&nbsp;
      <a href="${BASE_URL}/terms" style="color: #94a3b8;">Terms of Service</a>
    </p>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
