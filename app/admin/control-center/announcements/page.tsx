import { notFound } from 'next/navigation';
import { getAdminUserOrNull } from '@/lib/admin/control-access';
import { AnnouncementsPanel } from '@/components/vantag-control/AnnouncementsPanel';

export default async function AnnouncementsPage() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Product announcements</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Compose announcements, target segments, and record sends with audit trail. Email delivery can plug into the same
        pipeline.
      </p>
      <div className="mt-8">
        <AnnouncementsPanel />
      </div>
    </div>
  );
}
