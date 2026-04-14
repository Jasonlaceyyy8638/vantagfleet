'use client';

import { useEffect, useState } from 'react';

type Entry = {
  id: string;
  action: string;
  actor_email: string;
  actor_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function AuditLogTable() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (actor.trim()) q.set('actor', actor.trim());
      if (from.trim()) q.set('from', new Date(from).toISOString());
      if (to.trim()) q.set('to', new Date(to).toISOString());
      const res = await fetch(`/api/admin/audit?${q.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Failed');
        return;
      }
      setEntries(data.entries ?? []);
      setError(null);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-zinc-500">Actor email contains</label>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="mt-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            placeholder="info@…"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">From</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">To</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Apply
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map((e) => (
                <tr key={e.id} className="bg-zinc-950/40">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">{e.action}</td>
                  <td className="px-4 py-3 text-zinc-300">{e.actor_email}</td>
                  <td className="max-w-md px-4 py-3 font-mono text-xs text-zinc-500">
                    {e.metadata ? JSON.stringify(e.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No entries.</p>
          )}
        </div>
      )}
    </div>
  );
}
