'use client';

export type StateMiles = { state_code: string; miles: number };

type Props = {
  totalMiles: number;
  milesByState: StateMiles[];
  quarterLabel: string;
};

export function IftaSection({ totalMiles, milesByState, quarterLabel }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-soft-cloud">IFTA — Quarterly summary</h2>
      <p className="text-sm text-soft-cloud/70">{quarterLabel}</p>

      <div className="rounded-lg bg-midnight-ink/80 p-4">
        <p className="text-xs font-medium text-soft-cloud/60 uppercase tracking-wider">Total miles</p>
        <p className="text-2xl font-bold text-electric-teal mt-1">{totalMiles.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-soft-cloud/60 uppercase tracking-wider mb-2">Miles by state</p>
        {milesByState.length === 0 ? (
          <p className="text-sm text-soft-cloud/50">Add <code className="bg-midnight-ink px-1 rounded">state_code</code> to load records to see miles per state for IFTA reporting.</p>
        ) : (
          <ul className="space-y-2">
            {milesByState.map(({ state_code, miles }) => (
              <li key={state_code} className="flex justify-between items-center py-1.5 border-b border-white/5 text-sm">
                <span className="font-medium text-soft-cloud/90">{state_code}</span>
                <span className="text-soft-cloud/80">{miles.toLocaleString('en-US', { maximumFractionDigits: 0 })} mi</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
