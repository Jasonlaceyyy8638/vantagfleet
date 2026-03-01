import { createClient } from '@/lib/supabase/server';
import { isAdmin, getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { listVantagStaff } from '@/app/actions/admin-team';
import { TeamClient } from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  const role = await getPlatformRole(supabase);
  if (!admin && !isPlatformStaff(role)) redirect('/dashboard');

  const staff = await listVantagStaff();

  return <TeamClient initialStaff={staff} />;
}
