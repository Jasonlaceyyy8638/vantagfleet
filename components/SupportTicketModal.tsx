'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle, MessageCircle } from 'lucide-react';

const SUBJECT_OPTIONS = [
  'ELD Connection Issue',
  'ELD Connection Error',
  'Billing Question',
  'IFTA Discrepancy',
  'Other',
] as const;

const URGENCY_OPTIONS = ['Low', 'Medium', 'High'] as const;

type TicketContext = {
  companyName: string | null;
  dotNumber: string | null;
  eldProvider: string | null;
  userId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-fill subject when opening (e.g. "ELD Connection Error"). */
  initialSubject?: string;
  /** Pre-fill description when opening (e.g. error message for support). */
  initialDescription?: string;
};

export function SupportTicketModal({ open, onClose, initialSubject, initialDescription }: Props) {
  const [context, setContext] = useState<TicketContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<string>(URGENCY_OPTIONS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ companyName: string; dotNumber: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setSuccess(null);
    setError(null);
    setSubject(initialSubject ?? SUBJECT_OPTIONS[0]);
    setDescription(initialDescription ?? '');
    setUrgency(URGENCY_OPTIONS[1]);
    setContext(null);
    setContextLoading(true);
    fetch('/api/support-ticket')
      .then((res) => res.json())
      .then((data) => {
        setContext({
          companyName: data.companyName ?? null,
          dotNumber: data.dotNumber ?? null,
          eldProvider: data.eldProvider ?? null,
          userId: data.userId,
        });
        if (data.error && data.error !== 'Select an organization first.') {
          setError(data.error);
        }
      })
      .catch(() => setError('Could not load ticket context.'))
      .finally(() => setContextLoading(false));
  }, [open, initialSubject, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/support-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          description,
          urgency,
          currentUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit ticket.');
        return;
      }
      setSuccess({
        companyName: data.companyName ?? context?.companyName ?? 'your fleet',
        dotNumber: data.dotNumber ?? context?.dotNumber ?? '—',
      });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-ticket-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-midnight-ink shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {success ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-electric-teal/20 mb-4">
              <CheckCircle className="size-10 text-electric-teal" aria-hidden />
            </div>
            <h2 id="support-ticket-title" className="text-xl font-bold text-soft-cloud mb-2">
              Ticket Received
            </h2>
            <p className="text-soft-cloud/80 text-sm leading-relaxed mb-6">
              We&apos;ve received your request, {success.companyName}. A support specialist will look into DOT #{success.dotNumber} and get back to you shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyber-amber/20">
                  <MessageCircle className="size-6 text-cyber-amber" aria-hidden />
                </div>
                <h2 id="support-ticket-title" className="text-lg font-semibold text-soft-cloud">
                  Support Ticket
                </h2>
              </div>
              {contextLoading ? (
                <p className="text-sm text-soft-cloud/50">Loading…</p>
              ) : context?.companyName || context?.dotNumber ? (
                <p className="text-xs text-soft-cloud/50">
                  Submitting as <span className="text-soft-cloud/70 font-medium">{context.companyName ?? 'Unknown'}</span>
                  {context.dotNumber ? (
                    <> (DOT: {context.dotNumber})</>
                  ) : null}
                  {context.eldProvider ? (
                    <> · ELD: {context.eldProvider}</>
                  ) : null}
                </p>
              ) : (
                <p className="text-xs text-amber-400/90">
                  Select an organization in the sidebar so we know which fleet this is for.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="ticket-subject" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Subject
                </label>
                <select
                  id="ticket-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                >
                  {SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ticket-urgency" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Urgency
                </label>
                <select
                  id="ticket-urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                >
                  {URGENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ticket-description" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Description *
                </label>
                <textarea
                  id="ticket-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe your issue or question…"
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50 resize-y min-h-[100px]"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 text-soft-cloud hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
