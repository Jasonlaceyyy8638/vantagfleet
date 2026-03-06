import { Sidebar } from '@/components/Sidebar';
import { OrgSetup } from '@/components/OrgSetup';
import { ComplianceRequestFab } from '@/components/ComplianceRequestFab';
import { SupportChat } from '@/components/SupportChat';
import { ImpersonationBar } from '@/components/ImpersonationBar';
import { BetaCountdownBanner } from '@/components/BetaCountdownBanner';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isAdmin, canImpersonateCarrier, getDashboardOrgId, IMPERSONATE_COOKIE } from '@/lib/admin';
import { showBetaRibbon, hasFullAccess, canSeeMap } from '@/lib/userHasAccess';

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
  if ((user.user_metadata as Record<string, unknown>)?.must_change_password === true) {
    redirect('/account/change-password?required=1');
  }

  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  const staffCanImpersonate = await canImpersonateCarrier(supabase);

  // Admin or Support impersonating: stay on dashboard and use impersonated org; grant full carrier access
  if (staffCanImpersonate && impersonatedId) {
    const currentOrgId = impersonatedId;
    const admin = createAdminClient();
    const [{ data: org }, { data: impProfile }] = await Promise.all([
      admin.from('organizations').select('id, name, usdot_number, status, created_at, updated_at').eq('id', currentOrgId).single(),
      admin.from('profiles').select('is_founder').eq('org_id', currentOrgId).limit(1).maybeSingle(),
    ]);
    const organizations = org ? [org] : [];
    const showAdminLink = true;
    const isFounderImpersonating = (impProfile as { is_founder?: boolean } | null)?.is_founder === true;
    return (
      <div className="flex min-h-screen flex-col">
        <ImpersonationBar carrierName={org?.name?.trim() || 'this carrier'} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            organizations={organizations}
            currentOrgId={currentOrgId}
            showAdminLink={showAdminLink}
            showAdminGearInTauri={true}
            canSeeMap={true}
            isFounder={isFounderImpersonating}
            fullName={null}
          />
          <main className="flex-1 min-h-0 overflow-auto overflow-x-hidden pt-14 md:pt-0">
            {children}
          </main>
          <ComplianceRequestFab />
          <SupportChat />
        </div>
      </div>
    );
  }

  // Other platform admins (not owner): send to /admin when not impersonating
  const userIsAdmin = await isAdmin(supabase);
  const isOwner = user.id === ADMIN_OWNER_ID;
  if (!isOwner && userIsAdmin) redirect('/admin');

  const currentOrgId = await getDashboardOrgId(supabase, cookieStore);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('user_id', user.id);
  if (!currentOrgId) {
    if (isOwner) redirect('/admin');
    return <OrgSetup />;
  }

  const orgIds = Array.from(
    new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null))
  );
  const [
    { data: organizations },
    { data: profileRow },
    { data: orgRow },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, usdot_number, status, created_at, updated_at')
      .in('id', orgIds)
      .order('name'),
    supabase
      .from('profiles')
      .select('is_beta_tester, beta_expires_at, ifta_enabled, subscription_status, is_founder, full_name')
      .eq('user_id', user.id)
      .eq('org_id', currentOrgId)
      .single(),
    supabase
      .from('organizations')
      .select('subscription_status, tier')
      .eq('id', currentOrgId)
      .single(),
  ]);

  const showAdminLink = await isAdmin(supabase);
  const currentProfile = (profiles ?? []).find((p) => p.org_id === currentOrgId);
  const isDriverOnly = currentProfile?.role === 'Driver';
  const isDispatcher = currentProfile?.role === 'Dispatcher' || currentProfile?.role === 'Driver_Manager';
  const profileForAccess = profileRow as { is_beta_tester?: boolean; beta_expires_at?: string | null; ifta_enabled?: boolean; subscription_status?: string | null; is_founder?: boolean; full_name?: string | null } | null;
  const fullName = profileForAccess?.full_name ?? null;
  const orgForAccess = orgRow as { subscription_status?: string | null; tier?: string | null } | null;
  const fullAccess = hasFullAccess(profileForAccess, orgForAccess);
  const showBetaRibbonFlag = showBetaRibbon(profileForAccess, orgForAccess);
  const mapAccess = canSeeMap(profileForAccess, orgForAccess);

  if (profileForAccess?.is_beta_tester && profileForAccess?.beta_expires_at && !fullAccess) {
    const expiresAt = new Date(profileForAccess.beta_expires_at);
    if (!Number.isNaN(expiresAt.getTime()) && new Date() >= expiresAt) {
      redirect('/beta-ended');
    }
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar
        organizations={organizations ?? []}
        currentOrgId={currentOrgId}
        showAdminLink={showAdminLink}
        isDriverOnly={isDriverOnly}
        isDispatcher={isDispatcher}
        showBetaRibbon={showBetaRibbonFlag}
        canSeeMap={mapAccess}
        isFounder={profileForAccess?.is_founder === true}
        fullName={fullName}
      />
      <main className="flex-1 min-h-0 overflow-auto flex flex-col overflow-x-hidden pt-14 md:pt-0">
        <BetaCountdownBanner
          betaExpiresAt={profileForAccess?.beta_expires_at ?? null}
          isBetaTester={profileForAccess?.is_beta_tester === true}
        />
        {children}
      </main>
      <ComplianceRequestFab />
      <SupportChat />
    </div>
  );
}
