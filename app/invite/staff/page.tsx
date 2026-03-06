import { createClient } from '@/lib/supabase/server';
import { StaffInviteForm } from './StaffInviteForm';

type Props = { searchParams: Promise<{ token?: string }> };

export default async function StaffInvitePage({ searchParams }: Props) {
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
  const { data: rows } = await supabase.rpc('get_vantag_staff_invite_by_token', { invite_token: token });
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
        <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl text-center">
          <h1 className="text-xl font-bold text-cloud-dancer mb-2">Invalid or expired invite</h1>
          <p className="text-cloud-dancer/70 text-sm">This invite link may have expired or already been used.</p>
        </div>
      </div>
    );
  }

  const email = (row as { email: string }).email;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl">
        <h1 className="text-xl font-bold text-cloud-dancer mb-1">Join VantagFleet</h1>
        <p className="text-cloud-dancer/70 text-sm mb-6">
          You&apos;ve been invited to join the VantagFleet team. Create your password to get started.
        </p>
        <StaffInviteForm token={token} email={email} />
      </div>
    </div>
  );
}
