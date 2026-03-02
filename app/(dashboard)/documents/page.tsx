import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { NewHireDocumentsClient } from './NewHireDocumentsClient';

export default async function NewHireDocumentsPage() {
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
