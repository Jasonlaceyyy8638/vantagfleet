import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('vantag_help_resources')
    .select('title, excerpt')
    .eq('slug', slug)
    .maybeSingle();

  if (!data) {
    return { title: 'Resource | VantagFleet' };
  }
  return {
    title: `${data.title} | VantagFleet`,
    description: data.excerpt ?? undefined,
  };
}

export default async function PublicResourcePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('vantag_help_resources')
    .select('title, body_md, excerpt, category, published_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !row || !row.published_at) {
    notFound();
  }

  const paragraphs = (row.body_md ?? '').split('\n\n');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/90">
          {row.category ?? 'Resource'}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{row.title}</h1>
        {row.excerpt && <p className="mt-4 text-lg text-zinc-400">{row.excerpt}</p>}
        <div className="prose prose-invert mt-10 max-w-none">
          {paragraphs.map((p: string, i: number) => (
            <p key={i} className="mb-4 text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-12 text-sm">
          <Link href="/" className="text-amber-500/90 hover:underline">
            ← VantagFleet home
          </Link>
        </p>
      </article>
    </div>
  );
}
