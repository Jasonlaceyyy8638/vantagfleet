import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function NetworkPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('vf_demo')?.value === '1';

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-cloud-dancer">Network (vetted carriers)</h1>
      <p className="text-cloud-dancer/70 mb-4">
        Manage MC/DOT-verified partners, lanes, and compliance packets for carriers you work with.
      </p>
      {isDemo && (
        <p className="mb-6 text-sm text-cyber-amber/90">
          Demo — carrier vetting copy is shown on the broker dashboard and compliance views.
        </p>
      )}
      <Link
        href={isDemo ? '/dashboard?mode=demo&role=broker' : '/dashboard'}
        className="text-sm font-medium text-cyber-amber hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
