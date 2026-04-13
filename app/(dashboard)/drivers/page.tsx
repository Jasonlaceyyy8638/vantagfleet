import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { DriverListClient } from './DriverListClient';
import { getDashboardOrgId } from '@/lib/admin';
import { DEMO_ORG_ID, resolveDemoPage } from '@/src/constants/demoData';

export default async function DriversPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    const role = cookieStore.get('vf_demo_role')?.value === 'broker' ? 'broker' : 'carrier';
    const payload = resolveDemoPage(role, 'drivers') as {
      drivers: {
        id: string;
        name: string;
        license_number: string | null;
        license_state: string | null;
        med_card_expiry: string | null;
        clearinghouse_status: string | null;
      }[];
      complianceDocs: { id: string; driver_id: string | null; doc_type: string; file_path: string; expiry_date: string | null }[];
    };
    return (
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Drivers</h1>
        <p className="text-cloud-dancer/70 mb-6">Manage drivers, med card status, and DQ document uploads.</p>
        <DriverListClient
          demoMode
          orgId={DEMO_ORG_ID}
          initialDrivers={payload.drivers}
          initialComplianceDocs={payload.complianceDocs}
        />
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

  const [
    { data: drivers },
    { data: complianceDocs },
  ] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, name, license_number, license_state, med_card_expiry, clearinghouse_status')
      .eq('org_id', orgId)
      .order('name'),
    supabase
      .from('compliance_docs')
      .select('id, driver_id, doc_type, file_path, expiry_date')
      .eq('org_id', orgId),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Drivers</h1>
      <p className="text-cloud-dancer/70 mb-6">Manage drivers, med card status, and DQ document uploads.</p>
      <DriverListClient
        orgId={orgId}
        initialDrivers={drivers ?? []}
        initialComplianceDocs={complianceDocs ?? []}
      />
    </div>
  );
}
