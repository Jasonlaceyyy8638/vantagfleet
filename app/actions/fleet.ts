'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/** Add a vehicle (VIN, Plate, Year, Make, Model, Weight Class, Fuel Type) for the org. */
export async function addVehicle(
  orgId: string,
  data: {
    vin: string;
    plate: string;
    year: number | null;
    make?: string | null;
    model?: string | null;
    weight_class?: string | null;
    fuel_type?: string | null;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const vin = String(data.vin ?? '').trim();
  const plate = String(data.plate ?? '').trim();
  const year = data.year != null && Number.isInteger(Number(data.year)) ? Number(data.year) : null;
  const make = data.make != null ? String(data.make).trim() || null : null;
  const model = data.model != null ? String(data.model).trim() || null : null;
  const weight_class = data.weight_class != null ? String(data.weight_class).trim() || null : null;
  const fuel_type = data.fuel_type != null ? String(data.fuel_type).trim() || null : null;

  if (!vin) return { ok: false, error: 'VIN is required.' };

  const { data: row, error } = await supabase
    .from('vehicles')
    .insert({
      org_id: orgId,
      vin: vin || null,
      plate: plate || null,
      year: year,
      make: make,
      model: model,
      weight_class: weight_class,
      fuel_type: fuel_type,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/fleet');
  return { ok: true, id: row.id };
}

/** Assign a driver to a vehicle, or set to NULL to unassign. */
export async function setDriverAssignment(
  orgId: string,
  driverId: string,
  vehicleId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const { data: driver } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('id', driverId)
    .eq('org_id', orgId)
    .single();
  if (!driver) return { ok: false, error: 'Driver not found.' };

  if (vehicleId) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, org_id')
      .eq('id', vehicleId)
      .eq('org_id', orgId)
      .single();
    if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
    // Unassign any other driver currently assigned to this vehicle
    await supabase
      .from('drivers')
      .update({ assigned_vehicle_id: null })
      .eq('assigned_vehicle_id', vehicleId)
      .neq('id', driverId);
  }

  const { error } = await supabase
    .from('drivers')
    .update({ assigned_vehicle_id: vehicleId })
    .eq('id', driverId)
    .eq('org_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/fleet');
  return { ok: true };
}

/** Archive a driver (quit/left); they move to Archived and can be reactivated. */
export async function archiveDriver(
  orgId: string,
  driverId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const { error } = await supabase
    .from('drivers')
    .update({ status: 'archived', assigned_vehicle_id: null })
    .eq('id', driverId)
    .eq('org_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/fleet');
  return { ok: true };
}

/** Reactivate an archived driver; they appear in the Pool again. */
export async function reactivateDriver(
  orgId: string,
  driverId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized.' };

  const canAccess = await canAccessOrg(supabase, user.id, orgId);
  if (!canAccess) return { ok: false, error: 'Access denied.' };

  const { error } = await supabase
    .from('drivers')
    .update({ status: 'active' })
    .eq('id', driverId)
    .eq('org_id', orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/fleet');
  return { ok: true };
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
