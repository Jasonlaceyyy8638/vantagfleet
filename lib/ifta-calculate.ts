import { getStateTaxRate } from '@/lib/ifta-tax-rates';

export type StateMiles = { state_code: string; miles: number };
export type StateGallons = { state_code: string; gallons: number };

export type IftaRow = {
  state_code: string;
  miles: number;
  gallons: number;
  taxRequired: number;
  taxPaid: number;
  netOwed: number;
  isAuditRisk: boolean;
};

export type IftaResult = {
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  rows: IftaRow[];
};

/**
 * Reconciler: calculates IFTA liability from Motive miles and AI-scanned fuel (ifta_receipts).
 * - Sums Motive miles and receipt gallons for the quarter.
 * - Overall MPG = totalMiles / totalGallons.
 * - For each state: tax required = (stateMiles / MPG) * stateRate; tax paid = stateGallons * stateRate; net = required - paid.
 * - Flags Audit Risk when a state has miles but zero fuel receipts.
 */
export function calculateIfta(
  milesByState: StateMiles[],
  gallonsByState: StateGallons[],
  quarter: 1 | 2 | 3 | 4,
  year: number
): IftaResult {
  const totalMiles = milesByState.reduce((s, r) => s + r.miles, 0);
  const totalGallons = gallonsByState.reduce((s, r) => s + r.gallons, 0);
  const mpg = totalGallons > 0 && totalMiles > 0 ? totalMiles / totalGallons : 0;

  const gallonsMap = new Map(gallonsByState.map((g) => [g.state_code, g.gallons]));
  const allStates = Array.from(
    new Set([...milesByState.map((m) => m.state_code), ...gallonsByState.map((g) => g.state_code)])
  ).sort();

  const rows: IftaRow[] = allStates.map((state_code) => {
    const miles = milesByState.find((m) => m.state_code === state_code)?.miles ?? 0;
    const gallons = gallonsMap.get(state_code) ?? 0;
    const rate = getStateTaxRate(state_code, quarter, year);
    const taxableGallons = mpg > 0 ? miles / mpg : 0;
    const taxRequired = taxableGallons * rate;
    const taxPaid = gallons * rate;
    const netOwed = taxRequired - taxPaid;
    const isAuditRisk = miles > 0 && gallons === 0;
    return {
      state_code,
      miles,
      gallons,
      taxRequired,
      taxPaid,
      netOwed,
      isAuditRisk,
    };
  });

  return {
    totalMiles,
    totalGallons,
    mpg,
    rows,
  };
}
