import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DriverRegisterForm } from './DriverRegisterForm';

type Props = { searchParams: Promise<{ token?: string }> };

export default async function RegisterDriverPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token?.trim();
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-midnight-ink/90 backdrop-blur-md p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid link</h1>
          <p className="text-cloud-dancer/70 text-sm">This invite link is missing a token.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase.rpc('get_driver_invite_by_token', {
    invite_token: token,
  });
  const row = Array.isArray(rows) ? rows[0] : rows;
  const invite = row as { driver_id?: string; org_id?: string; email?: string; org_name?: string } | undefined;

  if (!invite?.driver_id || !invite?.org_id || !invite?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-midnight-ink/90 backdrop-blur-md p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid or expired invite</h1>
          <p className="text-cloud-dancer/70 text-sm">This link may have expired or already been used.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, driver_id')
      .eq('user_id', user.id)
      .eq('org_id', invite.org_id)
      .maybeSingle();
    if (profile?.org_id) redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-midnight-ink/90 backdrop-blur-md p-6 shadow-xl shadow-amber-500/5">
        <h1 className="text-xl font-bold text-cloud-dancer mb-1">Set your password</h1>
        <p className="text-cloud-dancer/70 text-sm mb-6">
          You’ve been invited to join <span className="text-cyber-amber font-medium">{invite.org_name ?? 'your carrier'}</span> on VantagFleet. Create a password to access <strong>My Uploads</strong> and your <strong>Roadside Folder</strong>.
        </p>
        <DriverRegisterForm token={token} email={invite.email} />
      </div>
    </div>
  );
}
