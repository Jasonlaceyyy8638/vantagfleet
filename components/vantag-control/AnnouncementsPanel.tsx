'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Announcement = {
  id: string;
  title: string;
  excerpt: string | null;
  status: string;
  scheduled_at: string | null;
  segment: string;
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
};

export function AnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [segment, setSegment] = useState<'all' | 'trial' | 'paid'>('all');
  const [scheduleLocal, setScheduleLocal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Failed to load');
        return;
      }
      setItems(data.announcements ?? []);
      setError(null);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const scheduled_at =
        scheduleLocal.trim() === ''
          ? undefined
          : new Date(scheduleLocal).toISOString();
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt: excerpt.trim() || null,
          body_md: bodyMd,
          segment,
          scheduled_at: scheduled_at ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Save failed');
        return;
      }
      setTitle('');
      setExcerpt('');
      setBodyMd('');
      setScheduleLocal('');
      await load();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function sendNow(id: string) {
    if (!confirm('Mark this announcement as sent and record recipient counts? (Email pipeline can be wired later.)')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/announcements/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Send failed');
        return;
      }
      await load();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold text-white">Compose</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Draft or schedule. Sending records audit + org counts; wire SendGrid for email when ready.
        </p>
        <form onSubmit={createDraft} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400">Excerpt (optional)</label>
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400">Body (markdown-friendly plain text)</label>
            <textarea
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400">Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as 'all' | 'trial' | 'paid')}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="all">All organizations</option>
              <option value="trial">Trial / trialing</option>
              <option value="paid">Paid (non-trial)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400">Schedule (optional, local time)</label>
            <input
              type="datetime-local"
              value={scheduleLocal}
              onChange={(e) => setScheduleLocal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft / schedule'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Recent</h2>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm"
              >
                <div className="font-medium text-white">{a.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {a.status} · {a.segment}
                  {a.sent_at && ` · sent ${new Date(a.sent_at).toLocaleString()}`}
                  {a.recipient_count != null && ` · ${a.recipient_count} orgs`}
                </div>
                {a.status !== 'sent' && (
                  <button
                    type="button"
                    onClick={() => sendNow(a.id)}
                    disabled={saving}
                    className="mt-2 text-xs font-semibold text-amber-400 hover:underline disabled:opacity-50"
                  >
                    Send now (record counts)
                  </button>
                )}
              </li>
            ))}
            {items.length === 0 && <li className="text-zinc-500">No announcements yet.</li>}
          </ul>
        )}
        <p className="mt-6 text-xs text-zinc-600">
          Analytics: optional <code className="text-zinc-500">vantag_announcement_events</code> for opens/clicks — stub
          table exists; charts can follow.
        </p>
        <p className="mt-2 text-xs">
          <Link href="/admin/control-center/audit" className="text-amber-500/90 hover:underline">
            View audit log
          </Link>
        </p>
      </section>
    </div>
  );
}
