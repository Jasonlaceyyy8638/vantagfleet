'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  mode: 'create' | 'edit';
  id?: string;
  initial?: {
    title: string;
    slug: string;
    excerpt: string;
    body_md: string;
    category: string;
    published: boolean;
  };
};

export function ResourceForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [bodyMd, setBodyMd] = useState(initial?.body_md ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'general');
  const [published, setPublished] = useState(initial?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug: slug.trim() || undefined,
            excerpt: excerpt.trim() || null,
            body_md: bodyMd,
            category,
            published,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? 'Failed');
          return;
        }
        router.push(`/admin/control-center/resources/${data.id}/edit`);
        router.refresh();
        return;
      }
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          body_md: bodyMd,
          category,
          published,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Failed');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (mode !== 'edit' || !id) return;
    if (!confirm('Delete this resource?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error ?? 'Delete failed');
        return;
      }
      router.push('/admin/control-center/resources');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
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
        <label className="block text-xs font-medium text-zinc-400">Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from title if empty on create"
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400">Excerpt</label>
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400">Body (markdown-friendly)</label>
        <textarea
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={14}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-sm text-white"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Published (visible at /resources/[slug])
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
