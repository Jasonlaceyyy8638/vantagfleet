import sgMail from '@sendgrid/mail';
import { getFromEmail, type EmailDepartment } from '@/lib/email-addresses';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export function isMailConfigured(): boolean {
  return !!SENDGRID_API_KEY?.trim();
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
  const key = SENDGRID_API_KEY?.trim();
  if (!key) {
    return { error: 'SendGrid is not configured (SENDGRID_API_KEY missing).' };
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
