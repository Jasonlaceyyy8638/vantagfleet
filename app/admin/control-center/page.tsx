import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUserOrNull } from '@/lib/admin/control-access';
import { countOrgsBySegment } from '@/lib/vantag-control-segments';

export default async function VantagControlDashboardPage() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  const admin = createAdminClient();

  const [resC, annC, auditC, orgTotal, trialC, paidC] = await Promise.all([
    admin.from('vantag_help_resources').select('id', { count: 'exact', head: true }),
    admin.from('vantag_announcements').select('id', { count: 'exact', head: true }),
    admin.from('vantag_control_audit_log').select('id', { count: 'exact', head: true }),
    admin.from('organizations').select('id', { count: 'exact', head: true }),
    countOrgsBySegment('trial'),
    countOrgsBySegment('paid'),
  ]);

  const stats = [
    { label: 'Help resources', value: resC.count ?? 0, href: '/admin/control-center/resources' },
    { label: 'Announcements', value: annC.count ?? 0, href: '/admin/control-center/announcements' },
    { label: 'Audit entries', value: auditC.count ?? 0, href: '/admin/control-center/audit' },
    { label: 'Organizations (total)', value: orgTotal.count ?? 0, href: '/admin/control-center/customers' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Next.js App Router · Supabase Auth &amp; Postgres · Stripe billing hooks for customers. This console is
        allowlisted to your corporate admin email only.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-white/10 bg-zinc-900/60 p-5 transition hover:border-amber-500/30"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Segments (approximate)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Used for announcement targeting from <code className="text-zinc-400">organizations</code> (
          <code className="text-zinc-400">trial_active</code>, <code className="text-zinc-400">subscription_status</code>
          ).
        </p>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <span className="text-zinc-300">
            Trial: <strong className="text-white">{trialC}</strong>
          </span>
          <span className="text-zinc-300">
            Paid (non-trial): <strong className="text-white">{paidC}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
