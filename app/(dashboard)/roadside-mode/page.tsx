import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import { getRoadsideSummaryForOrg } from '@/app/actions/roadside';
import { createClient } from '@/lib/supabase/server';
import { RoadsideModeClient } from '@/app/roadside-mode/RoadsideModeClient';

export default async function RoadsideModePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vantagfleet.com';
  const summary = await getRoadsideSummaryForOrg(orgId);

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <RoadsideModeClient orgId={orgId} appOrigin={appOrigin} summary={summary} />
    </div>
  );
}
