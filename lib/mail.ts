import sgMail from '@sendgrid/mail';
import { getFromEmail, type EmailDepartment } from '@/lib/email-addresses';

export function isMailConfigured(): boolean {
  const key = process.env.SENDGRID_API_KEY?.trim();
  return !!key && key.length > 10;
}

export type SendEmailOptions = {
  to: string;
  from?: string;
  /** Department type for default "from" when `from` is not set. */
  department?: EmailDepartment;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Send email via SendGrid.
 * From address: use options.from, or getFromEmail(options.department), or MARKETING (info@).
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ ok: true } | { error: string }> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key || key.length < 10) {
    return {
      error: 'SendGrid is not configured. Add SENDGRID_API_KEY to .env.local (no quotes, no spaces), then restart the dev server (stop and run npm run dev again).',
    };
  }

  const from =
    options.from ??
    getFromEmail(options.department ?? 'MARKETING');

  sgMail.setApiKey(key);

  try {
    await sgMail.send({
      to: options.to,
      from,
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
