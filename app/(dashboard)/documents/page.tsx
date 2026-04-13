import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { NewHireDocumentsClient } from './NewHireDocumentsClient';
import { DEMO_ORG_ID, resolveDemoPage } from '@/src/constants/demoData';

export default async function NewHireDocumentsPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    const role = cookieStore.get('vf_demo_role')?.value === 'broker' ? 'broker' : 'carrier';
    const payload = resolveDemoPage(role, 'documents') as {
      drivers: { id: string; name: string }[];
      docs: { id: string; driver_id: string; document_type: string; file_url: string; expiry_date: string | null }[];
    };
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-cloud-dancer mb-2">New Hire Documents</h1>
        <p className="text-cloud-dancer/70 mb-6">
          Upload carrier documents. AI will identify each file (COI, IFTA, registration, etc.) and extract expiry dates.
        </p>
        <NewHireDocumentsClient
          demoMode
          orgId={DEMO_ORG_ID}
          drivers={payload.drivers}
          initialDocs={payload.docs}
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

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name');

  const { data: docs } = await supabase
    .from('driver_documents')
    .select('id, driver_id, document_type, file_url, expiry_date')
    .in('driver_id', (drivers ?? []).map((d) => d.id));

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">New Hire Documents</h1>
      <p className="text-cloud-dancer/70 mb-6">
        Upload carrier documents. AI will identify each file (COI, IFTA, registration, etc.) and extract expiry dates.
      </p>
      <NewHireDocumentsClient
        orgId={orgId}
        drivers={drivers ?? []}
        initialDocs={docs ?? []}
      />
    </div>
  );
}
