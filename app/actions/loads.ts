'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { fetchMileageByStateAndQuarter } from '@/lib/ifta-motive';

export type LoadSegmentInput = { state_code: string; miles_driven: number };

/** Create a load and its IFTA segments. Segments sum must match total miles (loaded_miles + deadhead_miles). */
export async function createLoad(
  orgId: string,
  data: {
    load_date: string;
    driver_id?: string | null;
    vehicle_id?: string | null;
    revenue_cents?: number;
    deadhead_miles?: number;
    loaded_miles?: number;
    fuel_cost_cents?: number;
    detention_time_minutes?: number;
    notes?: string | null;
    segments?: LoadSegmentInput[];
  }
): Promise<{ ok: true; loadId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const totalMiles =
    Number(data.loaded_miles ?? 0) + Number(data.deadhead_miles ?? 0);
  const segments = data.segments ?? [];
  const segmentSum = segments.reduce((s, seg) => s + Number(seg.miles_driven ?? 0), 0);

  if (segments.length > 0 && Math.abs(segmentSum - totalMiles) > 0.01) {
    return {
      ok: false,
      error: `Segment miles (${segmentSum.toFixed(1)}) must match total miles (${totalMiles.toFixed(1)}).`,
    };
  }

  const { data: load, error: loadError } = await supabase
    .from('loads')
    .insert({
      org_id: orgId,
      load_date: data.load_date,
      driver_id: data.driver_id || null,
      vehicle_id: data.vehicle_id || null,
      revenue_cents: data.revenue_cents ?? 0,
      deadhead_miles: data.deadhead_miles ?? 0,
      loaded_miles: data.loaded_miles ?? null,
      fuel_cost_cents: data.fuel_cost_cents ?? 0,
      detention_time_minutes: data.detention_time_minutes ?? 0,
      notes: data.notes || null,
    })
    .select('id')
    .single();

  if (loadError || !load) return { ok: false, error: loadError?.message ?? 'Failed to create load.' };

  if (segments.length > 0) {
    const rows = segments
      .filter((s) => s.state_code?.trim() && Number(s.miles_driven) > 0)
      .map((s) => ({
        load_id: load.id,
        state_code: s.state_code.trim().toUpperCase(),
        miles_driven: Number(s.miles_driven),
      }));
    if (rows.length > 0) {
      const { error: segError } = await supabase.from('load_segments').insert(rows);
      if (segError) {
        await supabase.from('loads').delete().eq('id', load.id);
        return { ok: false, error: segError.message };
      }
    }
  }

  revalidatePath('/loads');
  return { ok: true, loadId: load.id };
}

/** Fetch Motive miles by state for a quarter (for pre-filling IFTA breakdown). */
export async function getMotiveMilesForQuarter(
  orgId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4
): Promise<
  | { ok: true; totalMiles: number; milesByState: { state_code: string; miles: number }[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };
  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const result = await fetchMileageByStateAndQuarter(orgId, year, quarter);
  if (result.error)
    return { ok: false, error: result.error };
  return {
    ok: true,
    totalMiles: result.totalMiles,
    milesByState: result.milesByState,
  };
}

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();
  if (profile) return true;
  const { data: member } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();
  return !!member;
}
