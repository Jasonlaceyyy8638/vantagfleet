'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createOrganization(name: string, usdot_number: string) {
  const trimmed = usdot_number?.trim();
  if (!trimmed) return { error: 'USDOT number is required.' };
  const supabase = createAdminClient();
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
