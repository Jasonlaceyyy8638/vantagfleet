import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';
import { getRoadsideSummaryForOrg } from '@/app/actions/roadside';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { EmailToOfficerButton } from './EmailToOfficerButton';
import { SignDailyLogButton } from './SignDailyLogButton';
import { ReportIncidentCard } from './ReportIncidentCard';
import { DotInspectionQrCard } from './DotInspectionQrCard';
import { DotInspectionEldCard } from './DotInspectionEldCard';
import { CallDispatchAndTruckStopButtons } from './CallDispatchAndTruckStopButtons';

const BUCKET = 'dq-documents';
const SIGNED_URL_EXPIRES = 3600; // 1 hour
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://vantagfleet.com';

export default async function RoadsideShieldPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  const params = await searchParams;

  if (!orgId) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0] p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#94a3b8]">No organization selected.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-[#f59e0b] underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const [{ data: org }, { data: docs }, summary] = await Promise.all([
    supabase.from('organizations').select('name, usdot_number, dispatch_phone').eq('id', orgId).single(),
    supabase.from('compliance_docs').select('id, doc_type, file_path').eq('org_id', orgId),
    getRoadsideSummaryForOrg(orgId),
  ]);

  const admin = createAdminClient();
  const docsWithUrls: { id: string; doc_type: string; viewUrl: string }[] = [];

  for (const doc of docs ?? []) {
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRES);
    if (signed?.signedUrl) {
      docsWithUrls.push({
        id: doc.id,
        doc_type: doc.doc_type,
        viewUrl: signed.signedUrl,
      });
    }
  }

  const carrierName = (org as { name?: string } | null)?.name ?? 'Carrier';
  const usdot = (org as { usdot_number?: string | null } | null)?.usdot_number ?? '—';
  const dispatchPhone = (org as { dispatch_phone?: string | null } | null)?.dispatch_phone ?? null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
      <style>{`
        .roadside-header { font-size: clamp(1.25rem, 5vw, 1.75rem); }
        .roadside-btn { min-height: 48px; font-size: 1rem; }
      `}</style>

      <header className="border-b border-white/10 bg-black/30 px-4 py-5">
        <h1 className="roadside-header font-bold text-white leading-tight">
          {carrierName}
        </h1>
        <p className="roadside-header font-bold text-[#f59e0b] mt-1">
          USDOT {usdot}
        </p>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Top half: DOT Inspection Mode */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">DOT Inspection Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DotInspectionQrCard orgId={orgId} appOrigin={APP_ORIGIN} />
            <DotInspectionEldCard summary={summary} />
            <div className="rounded-2xl border border-white/10 bg-[#1e293b] p-4 flex flex-col">
              <h3 className="text-base font-semibold text-amber-400 mb-2">Email Logs</h3>
              <p className="text-sm text-[#94a3b8] mb-3">
                Send compliance docs to the officer, share via email, or sign your daily log.
              </p>
              <div className="space-y-3 flex-1">
                <EmailToOfficerButton />
                <form
                  action="/api/driver/roadside-shield/share"
                  method="POST"
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
                >
                  <p className="text-xs text-[#94a3b8] mb-2">Send zip to officer&apos;s email</p>
                  <input
                    type="email"
                    name="officerEmail"
                    required
                    placeholder="officer@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-white/10 text-white placeholder-[#64748b] text-sm mb-2"
                  />
                  <button
                    type="submit"
                    className="roadside-btn w-full rounded-lg bg-[#f59e0b] text-black font-semibold px-3 py-2 text-sm"
                  >
                    Send zip
                  </button>
                </form>
                {params.sent === '1' && <p className="text-xs text-emerald-400">Email sent.</p>}
                {params.error && (
                  <p className="text-xs text-red-400">
                    {params.error === '1' ? 'Failed to send.' : decodeURIComponent(params.error)}
                  </p>
                )}
                <div>
                  <p className="text-xs text-[#94a3b8] mb-2">Sign daily log (watermarked on PDFs)</p>
                  <SignDailyLogButton />
                </div>
                {docsWithUrls.length > 0 && (
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-2">Ready for inspection</p>
                    <ul className="space-y-2 list-none p-0 m-0">
                      {docsWithUrls.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="roadside-btn block w-full text-center rounded-lg bg-[#f59e0b] text-black font-semibold px-3 py-2 text-sm no-underline"
                          >
                            {doc.doc_type} — View PDF
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call Dispatch & Find Truck Stop — side-by-side below DOT Inspection */}
          <div className="mt-6">
            <CallDispatchAndTruckStopButtons dispatchPhone={dispatchPhone} />
          </div>
        </section>

        {/* Driver Tools: Report Incident */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Driver Tools</h2>
          <div className="rounded-2xl border border-white/10 bg-[#1e293b] p-4 flex flex-col">
            <h3 className="text-base font-semibold text-amber-400 mb-2">Report Incident</h3>
            <p className="text-sm text-[#94a3b8] mb-3">
              Log DOT inspections, breakdowns, accidents, or citations. Dispatch is notified immediately.
            </p>
            <ReportIncidentCard />
          </div>
        </section>

        <p className="mt-8 text-center">
          <Link href="/dashboard" className="text-[#94a3b8] text-sm underline">
            Back to Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
