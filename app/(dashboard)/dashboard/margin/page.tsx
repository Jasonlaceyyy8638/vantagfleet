import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function MarginPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('vf_demo')?.value === '1';

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-cloud-dancer">Margin analytics</h1>
      <p className="text-cloud-dancer/70 mb-4">
        Customer rate vs carrier pay, lane-level margin, and settlement rollups will appear here.
      </p>
      {isDemo && (
        <p className="mb-6 text-sm text-cyber-amber/90">
          Demo — net margin is summarized on the broker dashboard home.
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
