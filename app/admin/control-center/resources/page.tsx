import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUserOrNull } from '@/lib/admin/control-access';

export default async function ControlResourcesListPage() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  const admin = createAdminClient();
  const { data: resources, error } = await admin
    .from('vantag_help_resources')
    .select('id, title, slug, category, published_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-400">
        Could not load resources. Apply migration 089 and ensure service role is configured.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Knowledge base articles. Published items are public at{' '}
            <code className="text-zinc-500">/resources/[slug]</code>.
          </p>
        </div>
        <Link
          href="/admin/control-center/resources/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          New article
        </Link>
      </div>

      <ul className="mt-8 divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
        {(resources ?? []).map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <span className="font-medium text-white">{r.title}</span>
              <span className="ml-2 text-zinc-500">/{r.slug}</span>
              <div className="mt-0.5 text-xs text-zinc-500">
                {r.category}
                {r.published_at ? (
                  <span className="ml-2 text-emerald-400/90">published</span>
                ) : (
                  <span className="ml-2 text-amber-400/90">draft</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {r.published_at && (
                <Link
                  href={`/resources/${r.slug}`}
                  className="text-xs text-zinc-400 hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  View public
                </Link>
              )}
              <Link
                href={`/admin/control-center/resources/${r.id}/edit`}
                className="text-xs font-semibold text-amber-400 hover:underline"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
        {(resources ?? []).length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">No articles yet.</li>
        )}
      </ul>
    </div>
  );
}
