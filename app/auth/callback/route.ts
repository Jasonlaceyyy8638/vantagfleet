import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && user) {
      const mustChange = (user.user_metadata as Record<string, unknown>)?.must_change_password === true;
      if (mustChange) {
        return NextResponse.redirect(`${origin}/account/change-password?required=1`);
      }
      if (user.id === ADMIN_OWNER_ID) {
        return NextResponse.redirect(`${origin}/admin`);
      }
      // Beta vs paid: after signup email confirm, non–beta users go to pricing; beta users land by account_type.
      const signupDashboardPaths = new Set(['/dashboard', '/dashboard/dispatch', '/dashboard/loads']);
      const isSignupDashboardFlow =
        signupDashboardPaths.has(redirectTo) ||
        (redirectTo.startsWith('/dashboard?') && redirectTo.split('?')[0] === '/dashboard');
      if (isSignupDashboardFlow) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_beta_tester, account_type')
          .eq('user_id', user.id)
          .not('org_id', 'is', null)
          .limit(1)
          .maybeSingle();
        const p = profile as { is_beta_tester?: boolean; account_type?: string | null } | null;
        const isBeta = p?.is_beta_tester === true;
        if (!isBeta) {
          return NextResponse.redirect(`${origin}/pricing`);
        }
        if (p?.account_type === 'broker') {
          return NextResponse.redirect(`${origin}/dashboard/loads`);
        }
        if (p?.account_type === 'carrier') {
          return NextResponse.redirect(`${origin}/dashboard/dispatch`);
        }
        return NextResponse.redirect(`${origin}/dashboard`);
      }
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
