import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { EmailToOfficerButton } from './EmailToOfficerButton';

const BUCKET = 'dq-documents';
const SIGNED_URL_EXPIRES = 3600; // 1 hour

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

  const [{ data: org }, { data: docs }] = await Promise.all([
    supabase.from('organizations').select('name, usdot_number').eq('id', orgId).single(),
    supabase.from('compliance_docs').select('id, doc_type, file_path').eq('org_id', orgId),
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

      <main className="p-4 max-w-lg mx-auto">
        {/* Email to Officer — primary CTA with modal */}
        <section className="mb-6">
          <EmailToOfficerButton />
        </section>

        {/* Share via Email — form fallback */}
        <section className="mb-8">
          <form
            action="/api/driver/roadside-shield/share"
            method="POST"
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <h2 className="text-base font-semibold text-amber-400 mb-3">
              Share via Email
            </h2>
            <p className="text-sm text-[#94a3b8] mb-3">
              Enter the officer&apos;s email to send a zip of all compliance docs in one click.
            </p>
            <input
              type="email"
              name="officerEmail"
              required
              placeholder="officer@example.com"
              className="w-full px-4 py-3 rounded-lg bg-[#1e293b] border border-white/10 text-white placeholder-[#64748b] text-base mb-3"
            />
            <button
              type="submit"
              className="roadside-btn w-full rounded-lg bg-[#f59e0b] text-black font-semibold px-4 py-3"
            >
              Send zip to officer
            </button>
          </form>
          {params.sent === '1' && (
            <p className="mt-2 text-sm text-emerald-400">Email sent successfully.</p>
          )}
          {params.error && (
            <p className="mt-2 text-sm text-red-400">
              {params.error === '1' ? 'Failed to send. Try again.' : decodeURIComponent(params.error)}
            </p>
          )}
        </section>

        {/* Ready for Inspection documents */}
        <section>
          <h2 className="text-base font-semibold text-white mb-3">
            Ready for Inspection
          </h2>
          {docsWithUrls.length === 0 ? (
            <p className="text-[#94a3b8] text-sm">No documents on file yet. Upload from Compliance or New Hire Documents.</p>
          ) : (
            <ul className="space-y-3 list-none p-0 m-0">
              {docsWithUrls.map((doc) => (
                <li key={doc.id} className="rounded-xl border border-white/10 bg-[#1e293b] p-4">
                  <p className="text-sm text-[#94a3b8] mb-3">{doc.doc_type}</p>
                  <a
                    href={doc.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roadside-btn block w-full text-center rounded-lg bg-[#f59e0b] text-black font-semibold px-4 py-3 no-underline"
                  >
                    View PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
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
