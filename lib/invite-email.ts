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

/** Dispatcher invite with set-password link. Subject: 🛡️ Access Granted: [Carrier Name] Command Center. */
export function getDispatcherSetPasswordInviteEmail(
  setPasswordLink: string,
  companyName: string,
  name: string
): { subject: string; text: string; html: string } {
  const subject = `🛡️ Access Granted: ${companyName} Command Center`;
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const text = [
    greeting,
    '',
    `you have been added as a Dispatcher for ${companyName} on VantagFleet.`,
    '',
    'Your account is ready. Click the link below to set your password and access the Live Fleet Map and Roadside Incident Dashboard.',
    '',
    setPasswordLink,
    '',
    'Welcome to the team.',
    '',
    '— VantagFleet',
  ].join('\n');

  const body = `
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_AMBER};">VantagFleet</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};">Access Granted: Command Center</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">You have been added as a Dispatcher for <strong>${escapeHtml(companyName)}</strong> on VantagFleet.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Your account is ready. Click the link below to set your password and access the Live Fleet Map and Roadside Incident Dashboard.</p>
          <p style="margin:0 0 24px;text-align:center;"><a href="${escapeHtml(setPasswordLink)}" style="display:inline-block;padding:12px 24px;background-color:${EMAIL_AMBER};color:${EMAIL_BG};font-weight:600;text-decoration:none;border-radius:8px;">Set Password &amp; Login</a></p>
          <p style="margin:0 0 8px;font-size:16px;color:${EMAIL_TEXT};">Welcome to the team.</p>
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

/** Driver invite with set-password link. Subject: 🚛 Your VantagFleet Driver Tool-Kit. Includes PWA instructions. */
export function getDriverSetPasswordInviteEmail(
  setPasswordLink: string,
  companyName: string,
  name: string
): { subject: string; text: string; html: string } {
  const subject = '🚛 Your VantagFleet Driver Tool-Kit';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const text = [
    greeting,
    '',
    `your fleet owner at ${companyName} has invited you to the VantagFleet mobile portal.`,
    '',
    'This tool allows you to show DOT logs instantly, report incidents, and find truck stops.',
    '',
    setPasswordLink,
    '',
    'Once you log in on your phone, remember to tap "Add to Home Screen" (Share icon on iPhone, 3-dots on Android) to install the VantagFleet app icon.',
    '',
    '— VantagFleet',
  ].join('\n');

  const body = `
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_AMBER};">VantagFleet</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};">Your VantagFleet Driver Tool-Kit</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">Your fleet owner at <strong>${escapeHtml(companyName)}</strong> has invited you to the VantagFleet mobile portal.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_TEXT};">This tool allows you to show DOT logs instantly, report incidents, and find truck stops.</p>
          <p style="margin:0 0 24px;text-align:center;"><a href="${escapeHtml(setPasswordLink)}" style="display:inline-block;padding:12px 24px;background-color:${EMAIL_AMBER};color:${EMAIL_BG};font-weight:600;text-decoration:none;border-radius:8px;">Set Password &amp; Get Started</a></p>
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${EMAIL_TEXT};">PWA: Add to Home Screen</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${EMAIL_MUTED};">Once you log in on your phone, tap &quot;Add to Home Screen&quot; (Share icon on iPhone, 3-dots on Android) to install the VantagFleet app icon.</p>
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

/** Team invite email: recipient clicks link to set their own password (no temp password). Carrier or Vantag staff. */
export function getTeamInviteSetPasswordEmail(
  inviteLink: string,
  options: { companyName?: string; name?: string; isVantagStaff?: boolean }
): { subject: string; text: string; html: string } {
  const { companyName = 'your team', name, isVantagStaff = false } = options;
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const intro = isVantagStaff
    ? "You've been invited to join the VantagFleet team."
    : `You've been invited to join ${companyName} on VantagFleet.`;
  const cta = 'Click the link below to create your password and get started.';

  const subject = isVantagStaff ? 'Join the VantagFleet Team' : `You're invited to join ${companyName}`;
  const text = [
    name ? `Hi ${name},` : 'Hi,',
    '',
    intro,
    '',
    cta,
    '',
    inviteLink,
    '',
    '— VantagFleet',
  ].join('\n');

  const logoUrl = getEmailLogoUrl();
  const logoBlock = logoUrl
    ? `<p style="margin:0 0 20px;text-align:center;"><img src="${escapeHtml(logoUrl)}" alt="VantagFleet" width="120" height="120" style="display:block;margin:0 auto;max-width:120px;height:auto;" /></p>`
    : `<p style="margin:0 0 20px;font-size:24px;font-weight:700;color:${EMAIL_AMBER};text-align:center;letter-spacing:0.05em;">VANTAGFLEET</p>`;
  const body = `
          ${logoBlock}
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${EMAIL_AMBER};text-align:center;">You're Invited</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${greeting}</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${intro}</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};">${cta}</p>
          <p style="margin:0 0 24px;text-align:center;"><a href="${escapeHtml(inviteLink)}" style="display:inline-block;padding:12px 24px;background-color:${EMAIL_AMBER};color:${EMAIL_BG};font-weight:600;text-decoration:none;border-radius:8px;">Create your password</a></p>
          <p style="margin:0;font-size:14px;color:${EMAIL_MUTED};">— VantagFleet</p>`;
  const html = emailWrapper(body);

  return { subject, text, html };
}

/** Welcome email when adding a team member with a temporary password (VantagFleet staff or carrier org). Kept for backward compat; prefer getTeamInviteSetPasswordEmail. */
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
    '--- YOUR TEMPORARY PASSWORD (use this to sign in the first time) ---',
    tempPassword,
    '--- COPY THE LINE ABOVE ---',
    '',
    `Sign in here: ${loginLink}`,
    '',
    'You must change this password after your first sign-in.',
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
          <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:${EMAIL_TEXT};"><strong>Your temporary password (use this to sign in, then you will set a new one):</strong></p>
          <p style="margin:0 0 8px;font-size:14px;color:${EMAIL_MUTED};">Copy the following line:</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${EMAIL_AMBER};letter-spacing:0.08em;word-break:break-all;font-family:monospace;">${escapeHtml(tempPassword)}</p>
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
