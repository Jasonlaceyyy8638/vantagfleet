import { createClient } from '@/lib/supabase/server';
import { InviteAcceptForm } from '@/app/invite/InviteAcceptForm';

type Props = { searchParams: Promise<{ token?: string }> };

/**
 * One-time set-password page for team invites (Driver / Dispatcher).
 * Link in email goes here; validates token and lets user set password and create account.
 */
export default async function SetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token;
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid invite</h1>
          <p className="text-cloud-dancer/70 text-sm">This link is missing a token.</p>
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

  const inviteEmail = (row as { email?: string | null }).email?.trim() ?? null;
  if (!inviteEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid invite</h1>
          <p className="text-cloud-dancer/70 text-sm">This link is for signing in. Use the invite page with your email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl">
        <h1 className="text-xl font-bold text-cloud-dancer mb-1">Set your password</h1>
        <p className="text-cloud-dancer/70 text-sm mb-6">
          You&apos;ve been invited to join <span className="text-cloud-dancer font-medium">{row.org_name}</span>. Choose a password to create your account.
        </p>
        <InviteAcceptForm token={token} orgName={row.org_name} inviteEmail={inviteEmail} />
      </div>
    </div>
  );
}
