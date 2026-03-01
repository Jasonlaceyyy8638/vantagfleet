import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { RoadsideModeClient } from './RoadsideModeClient';

const ORG_COOKIE = 'vantag-current-org-id';

export default async function RoadsideModePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id).filter(Boolean)));
  if (orgIds.length === 0) redirect('/dashboard');

  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  const orgId = stored && orgIds.includes(stored) ? stored : orgIds[0]!;

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vantagfleet.com';

  return (
    <RoadsideModeClient orgId={orgId} appOrigin={appOrigin} />
  );
}
