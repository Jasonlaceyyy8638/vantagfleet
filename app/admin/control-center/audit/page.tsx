import { notFound } from 'next/navigation';
import { getAdminUserOrNull } from '@/lib/admin/control-access';
import { AuditLogTable } from '@/components/vantag-control/AuditLogTable';

export default async function AuditLogPage() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Audit log</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Append-only actions from Vantag Control (resources, announcements, sends). Staff{' '}
        <code className="text-zinc-500">admin_logs</code> remains separate for platform employees.
      </p>
      <div className="mt-8">
        <AuditLogTable />
      </div>
    </div>
  );
}
