import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ComplianceStatusBadge } from '@/components/ComplianceStatusBadge';
import { DriverListClient } from './DriverListClient';
import { getDashboardOrgId } from '@/lib/admin';

export default async function DriversPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
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
