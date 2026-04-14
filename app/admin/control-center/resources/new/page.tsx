import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminUserOrNull } from '@/lib/admin/control-access';
import { ResourceForm } from '@/components/vantag-control/ResourceForm';

export default async function NewResourcePage() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  return (
    <div>
      <Link href="/admin/control-center/resources" className="text-sm text-amber-500/90 hover:underline">
        ← Resources
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">New article</h1>
      <div className="mt-8">
        <ResourceForm mode="create" />
      </div>
    </div>
  );
}
