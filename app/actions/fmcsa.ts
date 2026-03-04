'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchCarrierByUsdot } from '@/services/fmcsa';

/**
 * Fetches carrier data from FMCSA by USDOT and updates the organization
 * with Legal Name, Address, and Safety Rating. Call from settings or admin when user has an org with usdot_number.
 */
export async function syncOrganizationFromFmcsa(orgId: string): Promise<
  | { ok: true; legalName: string | null; address: string | null; safetyRating: string | null }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: org, error: fetchError } = await supabase
    .from('organizations')
    .select('usdot_number')
    .eq('id', orgId)
    .single();

  if (fetchError || !org) {
    return { ok: false, error: 'Organization not found.' };
  }

  const usdot = (org as { usdot_number?: string | null }).usdot_number?.trim();
  if (!usdot) {
    return { ok: false, error: 'No USDOT number on file. Add a USDOT to sync from FMCSA.' };
  }

  const carrier = await fetchCarrierByUsdot(usdot);
  if (!carrier) {
    return { ok: false, error: 'FMCSA carrier not found or lookup failed. Check USDOT and try again.' };
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      legal_name: carrier.legalName,
      address: carrier.address,
      safety_rating: carrier.safetyRating,
    })
    .eq('id', orgId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return {
    ok: true,
    legalName: carrier.legalName,
    address: carrier.address,
    safetyRating: carrier.safetyRating,
  };
}
