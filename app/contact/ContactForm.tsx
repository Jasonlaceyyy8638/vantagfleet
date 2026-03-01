'use client';

import { useState } from 'react';
import { submitTicket } from '@/app/actions/support-tickets';
import { Loader2, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';

type Props = { defaultEmail?: string | null };

export function ContactForm({ defaultEmail }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await submitTicket(name.trim(), email.trim(), subject.trim(), message.trim());
    setLoading(false);
    if ('ok' in result && result.ok) {
      setReference(result.reference);
      setName('');
      setSubject('');
      setMessage('');
      if (!defaultEmail) setEmail('');
    } else if ('error' in result) {
      setError(result.error);
    }
  };

  if (reference) {
    return (
      <div className="rounded-xl border border-cyber-amber/40 bg-cyber-amber/10 p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-cyber-amber/20 mb-4">
          <CheckCircle className="size-12 text-cyber-amber" aria-hidden />
        </div>
        <h2 className="text-xl font-bold text-soft-cloud mb-2">Ticket Submitted</h2>
        <p className="text-soft-cloud/80 mb-2">
          Thank you. We&apos;ll get back to you as soon as possible.
        </p>
        <p className="text-cyber-amber font-mono font-semibold text-lg">Reference: {reference}</p>
        <p className="text-sm text-soft-cloud/60 mt-2">Save this number to track your request.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium hover:bg-cyber-amber/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-soft-cloud/90 mb-1.5">
          Name *
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
          className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-soft-cloud/90 mb-1.5">
          Email *
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium text-soft-cloud/90 mb-1.5">
          Subject *
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="Brief subject"
          className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-soft-cloud/90 mb-1.5">
          Message *
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="How can we help?"
          className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50 resize-y min-h-[120px]"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        {loading ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
