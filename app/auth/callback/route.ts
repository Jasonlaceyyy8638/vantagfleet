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
      // Beta-to-paid: first 5 get is_beta_tester (handle_new_user); #6+ go to pricing after signup.
      if (redirectTo === '/dashboard') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_beta_tester')
          .eq('user_id', user.id)
          .not('org_id', 'is', null)
          .limit(1)
          .single();
        const isBeta = (profile as { is_beta_tester?: boolean } | null)?.is_beta_tester === true;
        if (!isBeta) {
          return NextResponse.redirect(`${origin}/pricing`);
        }
      }
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
