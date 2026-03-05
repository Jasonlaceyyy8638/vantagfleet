/**
 * Department email addresses for VantagFleet.
 * Use these constants and getFromEmail() so all contact points stay consistent.
 */

export const EMAIL_BILLING = 'billing@vantagfleet.com';
export const EMAIL_SUPPORT = 'support@vantagfleet.com';
export const EMAIL_FEEDBACK = 'feedback@vantagfleet.com';
export const EMAIL_INFO = 'info@vantagfleet.com';
export const EMAIL_NOREPLY = 'noreply@vantagfleet.com';

export type EmailDepartment = 'TRANSACTIONAL_BILLING' | 'APP_NOTIFICATION_SUPPORT' | 'MARKETING';

const FROM_BY_TYPE: Record<EmailDepartment, string> = {
  TRANSACTIONAL_BILLING: `VantagFleet Billing <${EMAIL_BILLING}>`,
  APP_NOTIFICATION_SUPPORT: `VantagFleet Support <${EMAIL_SUPPORT}>`,
  MARKETING: `VantagFleet <${EMAIL_INFO}>`,
};

/**
 * Returns the SendGrid "from" address (Name <email>) for the given department type.
 * Use with sendEmail({ ..., from: getFromEmail('APP_NOTIFICATION_SUPPORT') }).
 */
export function getFromEmail(type: EmailDepartment): string {
  const envKey =
    type === 'TRANSACTIONAL_BILLING'
      ? 'SENDGRID_BILLING_FROM_EMAIL'
      : type === 'APP_NOTIFICATION_SUPPORT'
        ? 'SENDGRID_SUPPORT_FROM_EMAIL'
        : 'SENDGRID_FROM_EMAIL';
  const env = typeof process !== 'undefined' ? process.env[envKey] : undefined;
  if (env?.trim()) return env.trim();
  return FROM_BY_TYPE[type];
}
