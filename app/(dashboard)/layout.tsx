import { Sidebar } from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { canAccessAdmin } from '@/lib/admin';

const ORG_COOKIE = 'vantag-current-org-id';

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

  const { data: organizations } =
    orgIds.length > 0
      ? await supabase
          .from('organizations')
          .select('id, name, usdot_number, status, created_at, updated_at')
          .in('id', orgIds)
          .order('name')
      : { data: [] };

  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  const currentOrgId =
    stored && orgIds.includes(stored)
      ? stored
      : orgIds[0] ?? null;

  const showAdminLink = await canAccessAdmin(supabase);

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
