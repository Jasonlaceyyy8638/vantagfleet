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

  const body = `
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_AMBER};">VantagFleet</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};">Access Granted: Dispatcher Command</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Hi,</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">You have been added as a Dispatcher for <strong>${escapeHtml(companyName)}</strong>.</p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Log in here to access the Live Map, Fleet Health, and Roadside Incident reports:</p>
          <p style="margin:0 0 24px;"><a href="${escapeHtml(loginLink)}" style="color:${EMAIL_AMBER};font-weight:600;">${escapeHtml(loginLink)}</a></p>
          <p style="margin:0;font-size:14px;color:${EMAIL_MUTED};">— VantagFleet</p>`;
  const html = emailWrapper(body);

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

  const body = `
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_AMBER};">VantagFleet</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};">Your VantagFleet Driver Tools</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Hi,</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Your fleet owner has invited you to use VantagFleet for fuel receipts and breakdown reporting.</p>
          <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${EMAIL_TEXT};">How to install the App on your phone:</p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Click this link on your phone's browser:</p>
          <p style="margin:0 0 20px;"><a href="${escapeHtml(loginLink)}" style="color:${EMAIL_AMBER};font-weight:600;word-break:break-all;">${escapeHtml(loginLink)}</a></p>
          <p style="margin:0 0 8px;font-size:15px;color:${EMAIL_TEXT};"><strong>For iPhone:</strong> Tap the &quot;Share&quot; icon (square with arrow) at the bottom, scroll down, and tap &quot;Add to Home Screen&quot;.</p>
          <p style="margin:0 0 16px;font-size:15px;color:${EMAIL_TEXT};"><strong>For Android:</strong> Tap the three dots (top right) and tap &quot;Install App&quot; or &quot;Add to Home Screen&quot;.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Once added, you can open VantagFleet directly from your home screen like any other app!</p>
          <p style="margin:0;font-size:14px;color:${EMAIL_MUTED};">— VantagFleet</p>`;
  const html = emailWrapper(body);

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vantagfleet.com';
// Logo URL for email: must be public HTTPS. Outlook works with SVG; Gmail often blocks SVG — set EMAIL_LOGO_URL to a PNG URL for Gmail.
function getEmailLogoUrl(): string | null {
  const envUrl = process.env.EMAIL_LOGO_URL?.trim();
  if (envUrl && (envUrl.startsWith('https://') || envUrl.startsWith('http://'))) return envUrl;
  // Use SVG by default (works in Outlook and many clients); use EMAIL_LOGO_URL with a PNG for Gmail
  if (defaultAppUrl.startsWith('http') && !defaultAppUrl.includes('localhost')) return `${defaultAppUrl.replace(/\/$/, '')}/logo.svg`;
  return null;
}

// Brand hex colors for Gmail (solid hex only — no rgba; Gmail strips/changes them)
const EMAIL_BG = '#0B0F19';       // midnight-ink
const EMAIL_CARD = '#131922';     // card
const EMAIL_AMBER = '#FFB000';    // cyber-amber
const EMAIL_TEXT = '#E2E8F0';     // soft-cloud
const EMAIL_MUTED = '#94A3B8';

// Gmail often ignores CSS background-color; bgcolor attribute is more reliable. Use both.
const BG = EMAIL_BG;
const CARD = EMAIL_CARD;
const AMBER = EMAIL_AMBER;

/** Gmail-friendly email wrapper: table layout, solid hex + bgcolor on every table/td for Gmail. */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:${BG};color:${EMAIL_TEXT};" bgcolor="${BG}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};" bgcolor="${BG}">
    <tr><td align="center" style="padding:32px 16px;background-color:${BG};color:${EMAIL_TEXT};" bgcolor="${BG}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;border:1px solid ${AMBER};border-radius:8px;background-color:${CARD};" bgcolor="${CARD}">
        <tr><td style="padding:28px 24px;background-color:${CARD};color:${EMAIL_TEXT};" bgcolor="${CARD}">
<div style="background-color:${CARD};color:${EMAIL_TEXT};" bgcolor="${CARD}">
${content}
</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Welcome email when adding a team member with a temporary password (VantagFleet staff or carrier org). */
export function getWelcomeToTeamEmail(
  loginLink: string,
  tempPassword: string,
  role: string,
  options: { name?: string; companyName?: string; isVantagStaff?: boolean } = {}
): { subject: string; text: string; html: string } {
  const { name, companyName = 'your team', isVantagStaff = false } = options;
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const intro = isVantagStaff
    ? `You've been added to the VantagFleet team with the role: ${escapeHtml(role)}.`
    : `You've been added to ${escapeHtml(companyName)} with the role: ${escapeHtml(role)}.`;

  const subject = isVantagStaff ? 'Welcome to the VantagFleet Team' : `Welcome to ${companyName} on VantagFleet`;
  const text = [
    name ? `Hi ${name},` : 'Hi,',
    '',
    intro,
    '',
    'Your temporary password (you must change it after first sign-in):',
    tempPassword,
    '',
    `Sign in here: ${loginLink}`,
    '',
    'You will be required to set a new password the first time you sign in.',
    '',
    '— VantagFleet',
  ].join('\n');

  const logoUrl = getEmailLogoUrl();
  const logoBlock = logoUrl
    ? `<p style="margin:0 0 20px;text-align:center;"><img src="${escapeHtml(logoUrl)}" alt="VantagFleet" width="120" height="120" style="display:block;margin:0 auto;max-width:120px;height:auto;" /></p>`
    : `<p style="margin:0 0 20px;font-size:24px;font-weight:700;color:${EMAIL_AMBER};text-align:center;letter-spacing:0.05em;">VANTAGFLEET</p>`;
  const body = `
          ${logoBlock}
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};text-align:center;">Welcome to the Team</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${greeting}</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${intro}</p>
          <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};"><strong>Your temporary password (change it after first sign-in):</strong></p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:${EMAIL_AMBER};letter-spacing:0.05em;word-break:break-all;">${escapeHtml(tempPassword)}</p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">Sign in here:</p>
          <p style="margin:0 0 24px;text-align:center;"><a href="${escapeHtml(loginLink)}" style="display:inline-block;padding:12px 24px;background-color:${EMAIL_AMBER};color:${EMAIL_BG};font-weight:600;text-decoration:none;border-radius:8px;">Sign in to VantagFleet</a></p>
          <p style="margin:0 0 24px;font-size:14px;color:${EMAIL_MUTED};">You will be required to set a new password the first time you sign in.</p>
          <p style="margin:0;font-size:14px;color:${EMAIL_MUTED};">— VantagFleet</p>`;
  const html = emailWrapper(body);

  return { subject, text, html };
}

/** Email when an existing user is added to the team (no temp password; they already have an account). */
export function getAddedToTeamEmail(
  loginLink: string,
  role: string,
  options: { name?: string; isVantagStaff?: boolean } = {}
): { subject: string; text: string; html: string } {
  const { name, isVantagStaff = false } = options;
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const intro = isVantagStaff
    ? `You've been added to the VantagFleet team with the role: ${escapeHtml(role)}.`
    : `You've been added to the team with the role: ${escapeHtml(role)}.`;

  const subject = isVantagStaff ? "You're on the VantagFleet Team" : "You've been added to the team";
  const text = [
    name ? `Hi ${name},` : 'Hi,',
    '',
    intro,
    '',
    `Sign in here: ${loginLink}`,
    '',
    '— VantagFleet',
  ].join('\n');

  const logoUrl = getEmailLogoUrl();
  const logoBlock = logoUrl
    ? `<p style="margin:0 0 20px;text-align:center;"><img src="${escapeHtml(logoUrl)}" alt="VantagFleet" width="120" height="120" style="display:block;margin:0 auto;max-width:120px;height:auto;" /></p>`
    : `<p style="margin:0 0 20px;font-size:24px;font-weight:700;color:${EMAIL_AMBER};text-align:center;letter-spacing:0.05em;">VANTAGFLEET</p>`;
  const body = `
          ${logoBlock}
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};text-align:center;">You're on the Team</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${greeting}</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${intro}</p>
          <p style="margin:0 0 24px;text-align:center;"><a href="${escapeHtml(loginLink)}" style="display:inline-block;padding:12px 24px;background-color:${EMAIL_AMBER};color:${EMAIL_BG};font-weight:600;text-decoration:none;border-radius:8px;">Sign in to VantagFleet</a></p>
          <p style="margin:0;font-size:14px;color:${EMAIL_MUTED};">— VantagFleet</p>`;
  const html = emailWrapper(body);

  return { subject, text, html };
}
