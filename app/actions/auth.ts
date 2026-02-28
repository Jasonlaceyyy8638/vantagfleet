'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createOrganization(name: string, usdot_number: string | null) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, usdot_number: usdot_number || null, status: 'active' })
    .select('id')
    .single();
  if (error) return { error: error.message };
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
