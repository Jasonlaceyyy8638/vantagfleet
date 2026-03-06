import nextDynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin, isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { listVantagStaff } from '@/app/actions/admin-team';
import { listSupportTickets } from '@/app/actions/support-tickets';
import { listMotiveDrivers } from '@/app/actions/admin';

const TeamClient = nextDynamic(
  () => import('./TeamClient').then((mod) => ({ default: mod.TeamClient })),
  { ssr: true, loading: () => <div className="min-h-[320px] flex items-center justify-center text-soft-cloud/60">Loading…</div> }
);

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  if (!(await canAccessAdmin(supabase))) redirect('/dashboard');
  const canManageTeam = await isAdmin(supabase);

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
      canManageTeam={canManageTeam}
    />
  );
}
