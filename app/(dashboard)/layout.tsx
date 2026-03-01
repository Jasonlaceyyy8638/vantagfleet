import { Sidebar } from '@/components/Sidebar';
import { OrgSetup } from '@/components/OrgSetup';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isAdmin } from '@/lib/admin';

const ORG_COOKIE = 'vantag-current-org-id';

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

  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);

  const orgIds = Array.from(
    new Set((profiles ?? []).map((p) => p.org_id).filter((id): id is string => id != null))
  );

  if (orgIds.length === 0) {
    if (user.id === ADMIN_OWNER_ID) redirect('/admin');
    const admin = await isAdmin(supabase);
    if (admin) redirect('/admin');
    return <OrgSetup />;
  }

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, usdot_number, status, created_at, updated_at')
    .in('id', orgIds)
    .order('name');

  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  const currentOrgId =
    stored && orgIds.includes(stored)
      ? stored
      : orgIds[0] ?? null;

  const showAdminLink = await isAdmin(supabase);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        organizations={organizations ?? []}
        currentOrgId={currentOrgId}
        showAdminLink={showAdminLink}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
