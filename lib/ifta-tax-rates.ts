/**
 * 2026 Q1 IFTA diesel tax rates ($ per gallon).
 * Used to compute tax required vs tax paid for the reconciler.
 * Source: IFTA jurisdiction rates; update quarterly as rates change.
 */
export const DIESEL_TAX_RATES_2026_Q1: Record<string, number> = {
  AL: 0.448, AK: 0.08, AZ: 0.27, AR: 0.329, CA: 0.68, CO: 0.509, CT: 0.4615,
  DE: 0.44, FL: 0.359, GA: 0.355, HI: 0.16, ID: 0.33, IL: 0.738, IN: 0.61,
  IA: 0.329, KS: 0.26, KY: 0.459, LA: 0.2, ME: 0.31, MD: 0.3685, MA: 0.34,
  MI: 0.524, MN: 0.287, MS: 0.18, MO: 0.42, MT: 0.35, NE: 0.289, NV: 0.27,
  NH: 0.226, NJ: 0.4435, NM: 0.229, NY: 0.405, NC: 0.385, ND: 0.23, OH: 0.47,
  OK: 0.16, OR: 0.36, PA: 0.741, RI: 0.34, SC: 0.26, SD: 0.28, TN: 0.27,
  TX: 0.2, UT: 0.295, VT: 0.32, VA: 0.287, WA: 0.494, WV: 0.354, WI: 0.329,
  WY: 0.24,
  // Canadian provinces (IFTA)
  AB: 0.49, BC: 0.45, MB: 0.38, NB: 0.41, NL: 0.42, NS: 0.42, ON: 0.47,
  PE: 0.38, QC: 0.42, SK: 0.35,
};

/** Returns diesel tax rate ($/gal) for a state/jurisdiction for 2026 Q1. Unknown states return 0. */
export function getStateTaxRate2026Q1(stateCode: string): number {
  const code = stateCode?.trim().toUpperCase().slice(0, 2);
  return code ? (DIESEL_TAX_RATES_2026_Q1[code] ?? 0) : 0;
}

/**
 * Returns diesel tax rate ($/gal) for the given quarter and year.
 * Currently only 2026 Q1 is defined; other quarters fall back to Q1 rates.
 */
export function getStateTaxRate(stateCode: string, quarter?: 1 | 2 | 3 | 4, year?: number): number {
  if (year === 2026 && quarter === 1) return getStateTaxRate2026Q1(stateCode);
  return getStateTaxRate2026Q1(stateCode);
}
