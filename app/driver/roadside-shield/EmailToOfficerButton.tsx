'use client';

import { useState } from 'react';
import { Mail, Loader2, X } from 'lucide-react';

export function EmailToOfficerButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/driver/roadside-shield/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerEmail: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage({ type: 'success', text: 'Compliance report sent successfully.' });
        setEmail('');
        setTimeout(() => {
          setOpen(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data?.error ?? 'Failed to send.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage(null);
          setEmail('');
        }}
        className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-lg border-2 border-amber-500/50 bg-amber-500/10 text-amber-400 font-semibold px-4 py-3 text-base hover:bg-amber-500/20 transition-colors"
      >
        <Mail className="size-5" />
        Email to Officer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-officer-title"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="email-officer-title" className="text-lg font-bold text-white">
                Email to Officer
              </h2>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-[#94a3b8] mb-4">
              Send an official VantagFleet Compliance Report (ZIP of all compliance docs) to the officer&apos;s email.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-[#1e293b] border border-white/10 text-white placeholder-[#64748b] text-base mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {message && (
                <p
                  className={`mb-4 text-sm ${
                    message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {message.text}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => !loading && setOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-white/20 text-[#e2e8f0] font-medium hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg bg-[#f59e0b] text-black font-semibold hover:bg-amber-500/90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send Compliance Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
