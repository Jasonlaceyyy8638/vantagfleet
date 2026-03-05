/**
 * Email content for org invite emails (Dispatcher vs Driver).
 * Used when Owner sends an invite from the Team page.
 */

export function getDispatcherInviteEmail(loginLink: string, companyName: string): { subject: string; text: string; html: string } {
  const subject = 'Access Granted: VantagFleet Dispatcher Command';
  const text = [
    'Hi,',
    '',
    `You have been added as a Dispatcher for ${companyName}.`,
    '',
    'Log in here to access the Live Map, Fleet Health, and Roadside Incident reports:',
    loginLink,
    '',
    '— VantagFleet',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="border:1px solid rgba(245,158,11,0.3);border-radius:16px;background:rgba(15,23,42,0.95);padding:28px;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#f59e0b;">VantagFleet</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f59e0b;">Access Granted: Dispatcher Command</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#cbd5e1;">Hi,</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cbd5e1;">You have been added as a Dispatcher for <strong>${escapeHtml(companyName)}</strong>.</p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#cbd5e1;">Log in here to access the Live Map, Fleet Health, and Roadside Incident reports:</p>
      <p style="margin:0 0 24px;"><a href="${escapeHtml(loginLink)}" style="color:#f59e0b;font-weight:600;">${escapeHtml(loginLink)}</a></p>
      <p style="margin:0;font-size:14px;color:#94a3b8;">— VantagFleet</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function getDriverInviteEmail(loginLink: string, companyName: string): { subject: string; text: string; html: string } {
  const subject = 'Your VantagFleet Driver Tools';
  const text = [
    'Hi,',
    '',
    `Your fleet owner has invited you to use VantagFleet for fuel receipts and breakdown reporting.`,
    '',
    'How to install the App on your phone:',
    '',
    `Click this link on your phone's browser: ${loginLink}`,
    '',
    'For iPhone: Tap the "Share" icon (square with arrow) at the bottom, scroll down, and tap "Add to Home Screen".',
    '',
    'For Android: Tap the three dots (top right) and tap "Install App" or "Add to Home Screen".',
    '',
    'Once added, you can open VantagFleet directly from your home screen like any other app!',
    '',
    '— VantagFleet',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="border:1px solid rgba(245,158,11,0.3);border-radius:16px;background:rgba(15,23,42,0.95);padding:28px;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#f59e0b;">VantagFleet</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f59e0b;">Your VantagFleet Driver Tools</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#cbd5e1;">Hi,</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cbd5e1;">Your fleet owner has invited you to use VantagFleet for fuel receipts and breakdown reporting.</p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#e2e8f0;">How to install the App on your phone:</p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#cbd5e1;">Click this link on your phone's browser:</p>
      <p style="margin:0 0 20px;"><a href="${escapeHtml(loginLink)}" style="color:#f59e0b;font-weight:600;word-break:break-all;">${escapeHtml(loginLink)}</a></p>
      <p style="margin:0 0 8px;font-size:15px;color:#cbd5e1;"><strong>For iPhone:</strong> Tap the &quot;Share&quot; icon (square with arrow) at the bottom, scroll down, and tap &quot;Add to Home Screen&quot;.</p>
      <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;"><strong>For Android:</strong> Tap the three dots (top right) and tap &quot;Install App&quot; or &quot;Add to Home Screen&quot;.</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#cbd5e1;">Once added, you can open VantagFleet directly from your home screen like any other app!</p>
      <p style="margin:0;font-size:14px;color:#94a3b8;">— VantagFleet</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
