import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { resolveDemoPage } from '@/src/constants/demoData';
import type { DemoCustomerRowExtended } from '@/src/constants/demoData';

export default async function CustomersPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    const role = cookieStore.get('vf_demo_role')?.value === 'broker' ? 'broker' : 'carrier';
    const rows = resolveDemoPage(role, 'customers') as DemoCustomerRowExtended[];
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Customers</h1>
        <p className="text-cloud-dancer/70 mb-6">
          Brokers and shippers linked to loads. Add counterparties from dispatch workflows or import later.
        </p>
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-white/10 bg-card/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="font-medium text-soft-cloud">{c.name}</p>
                <p className="text-xs text-cloud-dancer/60 mt-0.5">
                  MC {c.mc_number ?? '—'} · DOT {c.dot_number ?? '—'}
                  {c.credit_terms ? ` · ${c.credit_terms}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const supabase = await createClient();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-cloud-dancer/70">No organization selected.</p>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from('customers')
    .select('id, name, legal_name, mc_number, dot_number, credit_terms, billing_email, updated_at')
    .eq('org_id', orgId)
    .order('name');

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Customers</h1>
      <p className="text-cloud-dancer/70 mb-6">
        Brokers and shippers linked to loads. Add counterparties from dispatch workflows or import later.
      </p>
      {(rows?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-white/10 bg-card/40 p-8 text-center text-cloud-dancer/70 text-sm">
          No customers yet. Run migration <code className="text-cyber-amber">086_load_centric_tms</code> if this table is missing, then
          insert records via Supabase or an upcoming CRM form.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows!.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-white/10 bg-card/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="font-medium text-soft-cloud">{c.name}</p>
                <p className="text-xs text-cloud-dancer/60 mt-0.5">
                  MC {c.mc_number ?? '—'} · DOT {c.dot_number ?? '—'}
                  {c.credit_terms ? ` · ${c.credit_terms}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
