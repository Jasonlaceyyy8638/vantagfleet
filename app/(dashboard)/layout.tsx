import { Sidebar } from '@/components/Sidebar';
import { OrgSetup } from '@/components/OrgSetup';
import { ComplianceRequestFab } from '@/components/ComplianceRequestFab';
import { SupportChat } from '@/components/SupportChat';
import { ImpersonationBar } from '@/components/ImpersonationBar';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isAdmin, isSuperAdmin, getDashboardOrgId, IMPERSONATE_COOKIE } from '@/lib/admin';

/** VantagFleet admin owner: never show onboarding or DOT prompt; send to /admin. */
const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  const superAdmin = await isSuperAdmin(supabase);

  // Super-admin impersonating: stay on dashboard and use impersonated org
  if (superAdmin && impersonatedId) {
    const currentOrgId = impersonatedId;
    const admin = createAdminClient();
    const { data: org } = await admin
      .from('organizations')
      .select('id, name, usdot_number, status, created_at, updated_at')
      .eq('id', currentOrgId)
      .single();
    const organizations = org ? [org] : [];
    const showAdminLink = true;
    return (
      <div className="flex min-h-screen flex-col">
        <ImpersonationBar carrierName={org?.name ?? 'Unknown'} />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            organizations={organizations}
            currentOrgId={currentOrgId}
            showAdminLink={showAdminLink}
            showAdminGearInTauri={true}
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <ComplianceRequestFab />
          <SupportChat />
        </div>
      </div>
    );
  }

  // Non-impersonating super-admin/admin: send to /admin
  if (user.id === ADMIN_OWNER_ID) redirect('/admin');
  const userIsAdmin = await isAdmin(supabase);
  if (userIsAdmin) redirect('/admin');

  const currentOrgId = await getDashboardOrgId(supabase, cookieStore);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('user_id', user.id);
  if (!currentOrgId) {
    return <OrgSetup />;
  }

  const orgIds = Array.from(
    new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null))
  );
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, usdot_number, status, created_at, updated_at')
    .in('id', orgIds)
    .order('name');

  const showAdminLink = await isAdmin(supabase);
  const currentProfile = (profiles ?? []).find((p) => p.org_id === currentOrgId);
  const isDriverOnly = currentProfile?.role === 'Driver';

  return (
    <div className="flex min-h-screen">
      <Sidebar
        organizations={organizations ?? []}
        currentOrgId={currentOrgId}
        showAdminLink={showAdminLink}
        isDriverOnly={isDriverOnly}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ComplianceRequestFab />
      <SupportChat />
    </div>
  );
}
