import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'info@vantagfleet.com';

export function isMailConfigured(): boolean {
  return !!SENDGRID_API_KEY?.trim();
}

export async function sendEmail(options: {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: true } | { error: string }> {
  const key = SENDGRID_API_KEY?.trim();
  if (!key) {
    return { error: 'SendGrid is not configured (SENDGRID_API_KEY missing).' };
  }

  sgMail.setApiKey(key);

  try {
    await sgMail.send({
      to: options.to,
      from: options.from ?? FROM_EMAIL,
      subject: options.subject,
      text: options.text,
      html: options.html ?? options.text.replace(/\n/g, '<br>'),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SendGrid send failed';
    return { error: message };
  }
}
