'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformRole, isPlatformStaff, isAdmin } from '@/lib/admin';
import { EMAIL_SUPPORT } from '@/lib/email-addresses';

const SUPPORT_EMAIL = EMAIL_SUPPORT;
const DEFAULT_FROM_EMAIL = 'noreply@vantagfleet.com';
const DEFAULT_FROM_NAME = 'VantagFleet Support';

function generateReference(): string {
  const pad = Math.random().toString(36).slice(2, 8).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `VF-${date}-${pad}`;
}

function getSendGridFrom() {
  const email = process.env.SENDGRID_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const name = process.env.SENDGRID_FROM_NAME || DEFAULT_FROM_NAME;
  return { email, name };
}

/** Send email via SendGrid API. No-op if SENDGRID_API_KEY is missing. */
async function sendSendGridEmail(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return;
  const from = getSendGridFrom();
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from.email, name: from.name },
        subject,
        content: [{ type: 'text/plain', value: text }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('SendGrid error:', res.status, err);
    }
  } catch (err) {
    console.error('SendGrid send failed:', err);
  }
}

/** Send notification email to support via SendGrid. */
async function notifySupportTicket(ref: string, name: string, email: string, subject: string, message: string): Promise<void> {
  await sendSendGridEmail(
    SUPPORT_EMAIL,
    `[Support ${ref}] ${subject}`,
    `Reference: ${ref}\nFrom: ${name} <${email}>\n\n${message}`
  );
}

export type SubmitTicketResult = { ok: true; reference: string } | { error: string };

/** Submit a contact support ticket. Saves to DB and optionally emails support@vantagfleet.com via SendGrid. */
export async function submitTicket(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<SubmitTicketResult> {
  const n = name?.trim();
  const e = email?.trim();
  const s = subject?.trim();
  const m = message?.trim();
  if (!n) return { error: 'Name is required.' };
  if (!e) return { error: 'Email is required.' };
  if (!s) return { error: 'Subject is required.' };
  if (!m) return { error: 'Message is required.' };

  const reference = generateReference();
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Service is temporarily unavailable. Please try again later.' };
  }
  const { error } = await admin.from('support_tickets').insert({
    reference,
    name: n,
    email: e,
    subject: s,
    message: m,
    status: 'OPEN',
  });

  if (error) return { error: error.message };

  await notifySupportTicket(reference, n, e, s, m);
  return { ok: true, reference };
}

export type SupportTicketRow = {
  id: string;
  reference: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  reply_text: string | null;
  replied_at: string | null;
};

async function requireStaff() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (admin) return;
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) throw new Error('Forbidden');
}

/** List all support tickets for admin inbox. */
export async function listSupportTickets(): Promise<SupportTicketRow[]> {
  await requireStaff();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('support_tickets')
    .select('id, reference, name, email, subject, message, status, created_at, reply_text, replied_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as SupportTicketRow[];
}

/** Update ticket status (e.g. to RESOLVED). */
export async function updateTicketStatus(
  ticketId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const admin = createAdminClient();
  const { error } = await admin
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);
  if (error) return { error: error.message };
  return { ok: true };
}

/** Reply to a ticket: store reply and optionally send email to customer. */
export async function replyToTicket(
  ticketId: string,
  replyText: string
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const trimmed = replyText?.trim();
  if (!trimmed) return { error: 'Reply text is required.' };

  const admin = createAdminClient();
  const { data: ticket, error: fetchErr } = await admin
    .from('support_tickets')
    .select('id, reference, email')
    .eq('id', ticketId)
    .single();
  if (fetchErr || !ticket) return { error: 'Ticket not found.' };

  const { error: updateErr } = await admin
    .from('support_tickets')
    .update({
      reply_text: trimmed,
      replied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);
  if (updateErr) return { error: updateErr.message };

  // Send reply email to customer via SendGrid
  await sendSendGridEmail(
    (ticket as { email: string }).email,
    `Re: Your VantagFleet support request (${(ticket as { reference: string }).reference})`,
    trimmed
  );
  return { ok: true };
}
