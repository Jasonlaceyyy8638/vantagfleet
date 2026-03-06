import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { DispatcherProfileClient } from './DispatcherProfileClient';

export default async function DispatcherProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId);

  const firstProfile = (profiles ?? [])[0] as { role?: string } | undefined;
  const role = firstProfile?.role ?? null;
  if (role === 'Driver') redirect('/driver/roadside-shield');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, profile_image_url, dispatcher_status')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  const fullName = (profile as { full_name?: string | null })?.full_name ?? null;
  const phone = (profile as { phone?: string | null })?.phone ?? null;
  const profileImageUrl = (profile as { profile_image_url?: string | null })?.profile_image_url ?? null;
  const dispatcherStatus = (profile as { dispatcher_status?: 'Available' | 'On Break' | 'Off Duty' | null })?.dispatcher_status ?? null;

  return (
    <DispatcherProfileClient
      orgId={orgId}
      fullName={fullName}
      phone={phone}
      profileImageUrl={profileImageUrl}
      dispatcherStatus={dispatcherStatus}
    />
  );
}
