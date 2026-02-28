import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InviteAcceptForm } from './InviteAcceptForm';

type Props = { searchParams: Promise<{ token?: string }> };

export default async function InvitePage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token;
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid invite</h1>
          <p className="text-cloud-dancer/70 text-sm">This invite link is missing a token.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase.rpc('get_invite_by_token', { invite_token: token });
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row?.org_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid or expired invite</h1>
          <p className="text-cloud-dancer/70 text-sm">This invite link may have expired or already been used.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', row.org_id)
      .maybeSingle();
    if (existing) redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl">
        <h1 className="text-xl font-bold text-cloud-dancer mb-1">Join team</h1>
        <p className="text-cloud-dancer/70 text-sm mb-6">
          You’ve been invited to join <span className="text-cloud-dancer font-medium">{row.org_name}</span>. Sign up or sign in to continue.
        </p>
        <InviteAcceptForm token={token} orgName={row.org_name} />
      </div>
    </div>
  );
}
