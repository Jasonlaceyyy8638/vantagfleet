import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUserOrNull } from '@/lib/admin/control-access';
import { ResourceForm } from '@/components/vantag-control/ResourceForm';

type Props = { params: Promise<{ id: string }> };

export default async function EditResourcePage({ params }: Props) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  const { id } = await params;
  const admin = createAdminClient();
  const { data: row, error } = await admin.from('vantag_help_resources').select('*').eq('id', id).single();

  if (error || !row) notFound();

  return (
    <div>
      <Link href="/admin/control-center/resources" className="text-sm text-amber-500/90 hover:underline">
        ← Resources
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Edit article</h1>
      <div className="mt-8">
        <ResourceForm
          mode="edit"
          id={row.id}
          initial={{
            title: row.title,
            slug: row.slug,
            excerpt: row.excerpt ?? '',
            body_md: row.body_md ?? '',
            category: row.category ?? 'general',
            published: row.published_at != null,
          }}
        />
      </div>
    </div>
  );
}
