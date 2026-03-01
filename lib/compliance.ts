/**
 * Compliance score: 0–100 based on missing/expired docs and due dates.
 * Each missing or expired item reduces the score; items expiring within 30 days count partial.
 */
const DAYS_FOR_FULL_PENALTY = 30;
const MAX_SCORE = 100;

export function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpiringWithinDays(dateStr: string | null, days: number): boolean {
  const daysLeft = getDaysUntil(dateStr);
  if (daysLeft === null) return false;
  return daysLeft >= 0 && daysLeft <= days;
}

export function isExpired(dateStr: string | null): boolean {
  const daysLeft = getDaysUntil(dateStr);
  return daysLeft !== null && daysLeft < 0;
}

export function isMissingOrExpired(dateStr: string | null): boolean {
  if (!dateStr) return true;
  return isExpired(dateStr);
}

/** Buckets for DQ/document expiry: within 60, 30, or 7 days. */
export function getExpiryBucketDays(dateStr: string | null): number | null {
  return getDaysUntil(dateStr);
}

export type ExpiryStatus = 'safe' | 'warning' | 'expired';

/**
 * Returns compliance status for badge: Safe (Electric Teal) >30 days,
 * Warning (Yellow) within 30 days, Expired (Red) past due.
 */
export function getExpiryStatus(dateStr: string | null): ExpiryStatus | null {
  if (!dateStr) return null;
  const days = getDaysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days <= 30) return 'warning';
  return 'safe';
}

/** True if expiry is within the given number of days (and not yet expired). */
export function isWithinDays(dateStr: string | null, days: number): boolean {
  const d = getDaysUntil(dateStr);
  return d !== null && d >= 0 && d <= days;
}

/**
 * Compute compliance score from:
 * - drivers: med_card_expiry (missing or expired = penalty)
 * - vehicles: annual_inspection_due
 * - compliance_docs: expiry_date
 * Penalty: expired = 1 unit, expiring in <30 days = proportional (e.g. 0.5), else 0.
 * Score = max(0, 100 - total_penalty * points_per_item). We use 10 points per full penalty.
 */
export function computeComplianceScore(params: {
  driverCount: number;
  vehicleCount: number;
  docCount: number;
  expiredCount: number;
  expiringWithin30Count: number;
  missingCount: number;
}): number {
  const {
    driverCount,
    vehicleCount,
    docCount,
    expiredCount,
    expiringWithin30Count,
    missingCount,
  } = params;

  const totalItems = driverCount + vehicleCount + docCount;
  if (totalItems === 0) return MAX_SCORE;

  const fullPenalties = expiredCount + missingCount;
  const partialPenalties = expiringWithin30Count * 0.5;
  const totalPenalties = fullPenalties + partialPenalties;
  const pointsPerPenalty = MAX_SCORE / Math.max(totalItems, 1);
  const deduction = totalPenalties * pointsPerPenalty;

  return Math.round(Math.max(0, Math.min(MAX_SCORE, MAX_SCORE - deduction)));
}
