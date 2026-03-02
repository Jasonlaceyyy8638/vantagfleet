'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Loader2 } from 'lucide-react';

const CATEGORIES = ['Integration', 'Report', 'Alert'] as const;

export function ComplianceRequestFab() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch('/api/user-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: category, description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setOpen(false);
        setCategory(CATEGORIES[0]);
        setDescription('');
        setToast(true);
        setTimeout(() => setToast(false), 5000);
      } else {
        setError(data.error ?? 'Could not submit. Try again.');
      }
    } catch {
      setError('Request failed. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyber-amber text-midnight-ink shadow-lg hover:bg-cyber-amber/90 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:ring-offset-2 focus:ring-offset-midnight-ink transition-transform hover:scale-105"
        aria-label="Request a compliance feature"
      >
        <MessageSquarePlus className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => { setOpen(false); setError(null); }}
            aria-hidden
          />
          <div className="relative w-full max-w-lg rounded-xl border border-white/10 bg-card p-6 shadow-xl border-cyber-amber/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-soft-cloud">
                What compliance gap can we bridge?
              </h3>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                className="p-2 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="request-category" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Category
                </label>
                <select
                  id="request-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="request-description" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Description
                </label>
                <textarea
                  id="request-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the compliance feature or report you need..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50 resize-y min-h-[120px]"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sending || !description.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {sending ? 'Sending…' : 'Send to VantagFleet Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm rounded-lg border border-cyber-amber/40 bg-midnight-ink px-4 py-3 shadow-xl text-soft-cloud text-sm">
          We&apos;ve received your request! Our team will review this for our next Desktop App update.
        </div>
      )}
    </>
  );
}
