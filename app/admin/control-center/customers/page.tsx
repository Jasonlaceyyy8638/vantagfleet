import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUserOrNull } from '@/lib/admin/control-access';

export default async function ControlCustomersPage() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) notFound();

  const admin = createAdminClient();
  const { data: orgs, error } = await admin
    .from('organizations')
    .select(
      'id, name, created_at, subscription_status, trial_active, plan_level, stripe_customer_id, tier'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="mt-4 text-sm text-red-400">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Customers / tenants</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Organizations from Supabase. Quick billing actions (extend trial, credit, cancel) can call Stripe APIs from
        dedicated tools — <span className="text-zinc-500">use existing grant/refund endpoints or add org-scoped actions here.</span>
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Plan / tier</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Trial</th>
              <th className="px-4 py-3 font-medium">Stripe</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(orgs ?? []).map((o) => (
              <tr key={o.id} className="bg-zinc-950/40">
                <td className="px-4 py-3 font-medium text-white">{o.name}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {(o.plan_level as string) ?? '—'} {o.tier ? `· ${o.tier}` : ''}
                </td>
                <td className="px-4 py-3 text-zinc-400">{(o.subscription_status as string) ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-400">{o.trial_active ? 'yes' : 'no'}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {o.stripe_customer_id ? `${String(o.stripe_customer_id).slice(0, 12)}…` : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {o.created_at ? new Date(o.created_at as string).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(orgs ?? []).length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No organizations found.</p>
      )}
    </div>
  );
}
