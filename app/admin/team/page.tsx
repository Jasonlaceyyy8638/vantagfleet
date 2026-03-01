import { createClient } from '@/lib/supabase/server';
import { isAdmin, getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { listVantagStaff } from '@/app/actions/admin-team';
import { listSupportTickets } from '@/app/actions/support-tickets';
import { listMotiveDrivers } from '@/app/actions/admin';
import { TeamClient } from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  const role = await getPlatformRole(supabase);
  if (!admin && !isPlatformStaff(role)) redirect('/dashboard');

  let staff: Awaited<ReturnType<typeof listVantagStaff>> = [];
  let tickets: Awaited<ReturnType<typeof listSupportTickets>> = [];
  let motiveDrivers: Awaited<ReturnType<typeof listMotiveDrivers>> = [];
  try {
    [staff, tickets, motiveDrivers] = await Promise.all([
      listVantagStaff(),
      listSupportTickets(),
      listMotiveDrivers(),
    ]);
  } catch {
    staff = [];
    tickets = [];
    motiveDrivers = [];
  }

  return (
    <TeamClient
      initialStaff={staff}
      initialTickets={tickets}
      initialMotiveDrivers={motiveDrivers}
    />
  );
}
