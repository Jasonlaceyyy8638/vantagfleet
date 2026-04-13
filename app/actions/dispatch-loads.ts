'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export type LoadStopInput = {
  sequence_order: number;
  stop_type: 'pickup' | 'delivery';
  location_name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type CreateDispatchLoadInput =
  | {
      broker_listing: true;
      load_date: string;
      shipper_info: string;
      consignee_info: string;
      linehaul_customer_usd: number;
      max_buy_carrier_usd: number;
      customer_id?: string | null;
      reference_number?: string | null;
      notes?: string | null;
      stops: LoadStopInput[];
    }
  | {
      broker_listing?: false;
      load_date: string;
      driver_id: string;
      vehicle_id: string;
      customer_id?: string | null;
      reference_number?: string | null;
      rate_to_carrier?: number | null;
      driver_pay?: number | null;
      notes?: string | null;
      stops: LoadStopInput[];
    };

/** Create a TMS load: carrier dispatch (assigned) or broker marketplace listing (available). */
export async function createDispatchLoad(
  orgId: string,
  data: CreateDispatchLoadInput
): Promise<{ ok: true; loadId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const stops = data.stops
    .filter((s) => s.stop_type === 'pickup' || s.stop_type === 'delivery')
    .sort((a, b) => a.sequence_order - b.sequence_order);
  if (stops.length < 1) {
    return { ok: false, error: 'Add at least one pickup or delivery stop.' };
  }

  const isBroker = data.broker_listing === true;

  let notesCombined = data.notes?.trim() ?? '';
  let revenueCents = 0;
  let rateToCarrier: number | null = null;
  let driverPay: number | null = null;
  let driverId: string | null = null;
  let vehicleId: string | null = null;
  let status: 'available' | 'assigned' = 'assigned';

  if (isBroker) {
    const shipper = data.shipper_info.trim();
    const consignee = data.consignee_info.trim();
    if (!shipper || !consignee) {
      return { ok: false, error: 'Enter shipper and consignee details.' };
    }
    if (!Number.isFinite(data.linehaul_customer_usd) || data.linehaul_customer_usd < 0) {
      return { ok: false, error: 'Enter a valid linehaul (customer) rate.' };
    }
    if (!Number.isFinite(data.max_buy_carrier_usd) || data.max_buy_carrier_usd < 0) {
      return { ok: false, error: 'Enter a valid max buy (carrier pay).' };
    }
    revenueCents = Math.round(data.linehaul_customer_usd * 100);
    rateToCarrier = data.max_buy_carrier_usd;
    driverPay = null;
    status = 'available';
    const header = `Shipper: ${shipper}\nConsignee: ${consignee}`;
    notesCombined = notesCombined ? `${header}\n\n${notesCombined}` : header;
  } else {
    driverId = data.driver_id;
    vehicleId = data.vehicle_id;
    rateToCarrier = data.rate_to_carrier ?? null;
    driverPay = data.driver_pay ?? null;
  }

  const { data: load, error: loadError } = await supabase
    .from('loads')
    .insert({
      org_id: orgId,
      load_date: data.load_date,
      driver_id: driverId,
      vehicle_id: vehicleId,
      customer_id: data.customer_id ?? null,
      reference_number: data.reference_number?.trim() || null,
      rate_to_carrier: rateToCarrier,
      driver_pay: driverPay,
      notes: notesCombined || null,
      status,
      revenue_cents: revenueCents,
      deadhead_miles: 0,
      fuel_cost_cents: 0,
      detention_time_minutes: 0,
    })
    .select('id')
    .single();

  if (loadError || !load) {
    return { ok: false, error: loadError?.message ?? 'Failed to create load.' };
  }

  const stopRows = stops.map((s) => ({
    load_id: load.id,
    sequence_order: s.sequence_order,
    stop_type: s.stop_type,
    location_name: s.location_name ?? null,
    address_line1: s.address_line1 ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    postal_code: s.postal_code ?? null,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
  }));

  const { error: stopsError } = await supabase.from('load_stops').insert(stopRows);
  if (stopsError) {
    await supabase.from('loads').delete().eq('id', load.id);
    return { ok: false, error: stopsError.message };
  }

  revalidatePath('/dispatch');
  revalidatePath('/loads');
  revalidatePath('/dashboard/marketplace');
  return { ok: true, loadId: load.id };
}
