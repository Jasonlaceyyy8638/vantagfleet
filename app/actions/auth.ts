'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createOrganization(name: string, usdot_number: string) {
  const trimmed = usdot_number?.trim();
  if (!trimmed) return { error: 'USDOT number is required.' };
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return { error: 'Service is temporarily unavailable. Please try again later.' };
  }
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, usdot_number: trimmed, status: 'active' })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505' || error.message?.includes('organizations_usdot_number') || error.message?.includes('unique constraint')) {
      return { error: 'This USDOT number is already registered. Use a different number or sign in to your existing account.' };
    }
    return { error: error.message };
  }
  return { orgId: data.id };
}

export async function createProfileAfterSignUp(orgId: string, fullName: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase.from('profiles').insert({
    user_id: user.id,
    org_id: orgId,
    role: 'Owner',
    full_name: fullName || null,
  });
  if (error) return { error: error.message };
  redirect('/dashboard');
}

/** Create organization and link current user as Owner (for users with no org). */
export async function setupOrganization(
  companyName: string,
  dotNumber: string,
  fleetSize: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const name = companyName?.trim();
  const usdot = dotNumber?.trim();
  if (!name) return { error: 'Company name is required.' };
  if (!usdot) return { error: 'DOT number is required.' };

  const trimmedFleet = fleetSize?.trim();
  const fleetSizeNum = trimmedFleet ? parseInt(trimmedFleet, 10) : null;
  if (trimmedFleet && (fleetSizeNum == null || Number.isNaN(fleetSizeNum) || fleetSizeNum < 0)) {
    return { error: 'Fleet size must be a positive number.' };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Service is temporarily unavailable. Please try again later.' };
  }
  const { data: org, error: insertError } = await admin
    .from('organizations')
    .insert({
      name,
      usdot_number: usdot,
      status: 'active',
      fleet_size: fleetSizeNum ?? null,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505' || insertError.message?.includes('organizations_usdot_number') || insertError.message?.includes('unique constraint')) {
      return { error: 'This DOT number is already registered. Use a different number or sign in to your existing account.' };
    }
    return { error: insertError.message };
  }

  const orgId = org.id;

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('org_id', null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await admin
      .from('profiles')
      .update({ org_id: orgId, role: 'Owner' })
      .eq('id', existing.id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertProfileError } = await admin.from('profiles').insert({
      user_id: user.id,
      org_id: orgId,
      role: 'Owner',
      full_name: null,
    });
    if (insertProfileError) return { error: insertProfileError.message };
  }

  return { ok: true };
}
