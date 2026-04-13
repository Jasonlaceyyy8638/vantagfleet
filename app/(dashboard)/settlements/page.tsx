import { cookies } from 'next/headers';
import { SettlementsSandboxView } from '@/src/components/demo/SettlementsSandboxView';

export default async function SettlementsPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('vf_demo')?.value === '1') {
    return <SettlementsSandboxView />;
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Settlements</h1>
      <p className="text-cloud-dancer/70 mb-4">
        Carrier and driver settlements from completed loads will appear here. This module hooks into{' '}
        <code className="text-cyber-amber/90">loads.rate_to_carrier</code>,{' '}
        <code className="text-cyber-amber/90">loads.driver_pay</code>, and load lifecycle status.
      </p>
      <div className="rounded-xl border border-dashed border-white/15 bg-card/30 p-6 text-sm text-cloud-dancer/70">
        Coming next: settlement batches, deductions, and accounting export — built on the new TMS schema (migration 086).
      </div>
    </div>
  );
}
