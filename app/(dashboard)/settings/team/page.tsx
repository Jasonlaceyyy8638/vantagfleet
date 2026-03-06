import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId, canImpersonateCarrier, IMPERSONATE_COOKIE } from '@/lib/admin';
import { cookies } from 'next/headers';
import { TeamManagementClient } from './TeamManagementClient';

export type TeamMember = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
};

export type PendingInvite = {
  id: string;
  email: string | null;
  invite_role: string;
  created_at: string;
};

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/settings');

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();
  const role = (myProfile as { role?: string } | null)?.role;
  const isImpersonating = cookieStore.get(IMPERSONATE_COOKIE)?.value && (await canImpersonateCarrier(supabase));
  if (role !== 'Owner' && role !== 'Admin' && role !== 'Safety_Manager' && !isImpersonating) redirect('/settings');

  const admin = createAdminClient();
  const { data: profiles } = await admin.from('profiles').select('id, user_id, full_name, phone, role').eq('org_id', orgId).order('role');
  const members: TeamMember[] = [];
  for (const p of profiles ?? []) {
    const row = p as { id: string; user_id: string; full_name: string | null; phone?: string | null; role: string };
    let email: string | null = null;
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
      email = authUser?.user?.email ?? null;
    } catch {
      // ignore
    }
    members.push({
      id: row.id,
      user_id: row.user_id,
      email,
      full_name: row.full_name,
      phone: row.phone ?? null,
      role: row.role,
    });
  }

  const { data: invites } = await admin
    .from('org_invites')
    .select('id, email, invite_role, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  const pendingInvites: PendingInvite[] = (invites ?? []).map((i) => ({
    id: (i as { id: string }).id,
    email: (i as { email?: string | null }).email ?? null,
    invite_role: (i as { invite_role: string }).invite_role,
    created_at: (i as { created_at: string }).created_at,
  }));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Team Management</h1>
      <p className="text-soft-cloud/70 mb-8">
        Invite users by email and assign roles. Admins have full access; Dispatchers can use Map and Roadside; Drivers have limited access.
      </p>
      <TeamManagementClient
        orgId={orgId}
        members={members}
        pendingInvites={pendingInvites}
        currentUserId={user.id}
      />
    </div>
  );
}
