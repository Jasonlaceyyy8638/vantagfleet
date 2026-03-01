import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { listStaff } from '@/app/actions/admin-team';
import { TeamClient } from './TeamClient';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) redirect('/dashboard');

  const staff = await listStaff();

  return <TeamClient initialStaff={staff} />;
}
