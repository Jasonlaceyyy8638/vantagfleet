import { Sidebar } from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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

  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id)));
  if (orgIds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-slate-400">
          <p>No organization assigned. Contact your admin or create an organization.</p>
        </div>
      </div>
    );
  }

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, usdot_number, status')
    .in('id', orgIds)
    .order('name');

  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  const currentOrgId =
    stored && orgIds.includes(stored)
      ? stored
      : orgIds[0] ?? null;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        organizations={organizations ?? []}
        currentOrgId={currentOrgId}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
