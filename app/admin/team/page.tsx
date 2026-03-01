import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { listVantagStaff } from '@/app/actions/admin-team';
import { TeamClient } from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) redirect('/dashboard');

  const staff = await listVantagStaff();

  return <TeamClient initialStaff={staff} />;
}
