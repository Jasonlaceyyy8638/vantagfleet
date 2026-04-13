import { isExpired, isMissingOrExpired } from '@/lib/compliance';

/** Driver must be clear for dispatch: med card valid, compliance scanner not blocking. */
export function isDriverDispatchEligible(driver: {
  compliance_status: string | null;
  med_card_expiry: string | null;
  status?: string | null;
}): boolean {
  if (driver.status === 'archived') return false;
  if (driver.compliance_status === 'REVIEW_REQUIRED') return false;
  if (isMissingOrExpired(driver.med_card_expiry)) return false;
  return true;
}

export function driverDispatchIneligibilityReason(driver: {
  compliance_status: string | null;
  med_card_expiry: string | null;
  status?: string | null;
}): string | null {
  if (driver.status === 'archived') return 'Archived';
  if (driver.compliance_status === 'REVIEW_REQUIRED') return 'Compliance review required';
  if (!driver.med_card_expiry) return 'Med card missing';
  if (isExpired(driver.med_card_expiry)) return 'Med card expired';
  return null;
}

/** Vehicle must have current annual inspection to dispatch. */
export function isVehicleDispatchEligible(vehicle: { annual_inspection_due: string | null }): boolean {
  return !isMissingOrExpired(vehicle.annual_inspection_due);
}

export function vehicleDispatchIneligibilityReason(vehicle: {
  annual_inspection_due: string | null;
}): string | null {
  if (!vehicle.annual_inspection_due) return 'Inspection date missing';
  if (isExpired(vehicle.annual_inspection_due)) return 'Annual inspection expired';
  return null;
}
