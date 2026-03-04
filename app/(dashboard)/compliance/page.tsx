import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { ComplianceClient } from './ComplianceClient';

export default async function CompliancePage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-soft-cloud mb-2">Compliance</h1>
        <p className="text-soft-cloud/70">No organization selected.</p>
      </div>
    );
  }

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name');

  const driverIds = (drivers ?? []).map((d) => d.id);
  let docs: { id: string; driver_id: string; document_type: string; file_url: string | null; expiry_date: string | null; status?: string | null; liability_limit?: number | string | null; cargo_limit?: number | string | null; non_compliant?: boolean | null }[] = [];
  if (driverIds.length > 0) {
    const { data } = await supabase
      .from('driver_documents')
      .select('id, driver_id, document_type, file_url, expiry_date, status, liability_limit, cargo_limit, non_compliant')
      .eq('document_type', 'COI')
      .in('driver_id', driverIds);
    docs = data ?? [];
  }

  const coiDocs = docs.map((d) => ({
    id: d.id,
    driver_id: d.driver_id,
    document_type: d.document_type,
    file_url: d.file_url ?? '',
    expiry_date: d.expiry_date,
    status: (d as { status?: string | null }).status ?? null,
    liability_limit: (d as { liability_limit?: number | string | null }).liability_limit != null
      ? Number((d as { liability_limit?: number | string | null }).liability_limit)
      : null,
    cargo_limit: (d as { cargo_limit?: number | string | null }).cargo_limit != null
      ? Number((d as { cargo_limit?: number | string | null }).cargo_limit)
      : null,
    non_compliant: (d as { non_compliant?: boolean | null }).non_compliant ?? null,
  }));

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Compliance</h1>
      <p className="text-soft-cloud/70 mb-6">
        Upload and track compliance documents. Certificate of Insurance (COI) uploads are scanned for Policy Expiration
        Date, Liability Limit, and Cargo Limit. Documents with a past expiration are marked <span className="text-red-400 font-medium">Expired</span>;
        liability below $1,000,000 is flagged as <span className="text-amber-400 font-medium">Non-Compliant</span>.
      </p>
      <ComplianceClient
        orgId={orgId}
        drivers={drivers ?? []}
        initialCoiDocs={coiDocs}
      />
    </div>
  );
}
