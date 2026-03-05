import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** VantagFleet owner: always treat as ADMIN; bypass all org/DOT checks. */
const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

export async function updateSession(
  request: NextRequest,
  pathname?: string
): Promise<{ response: NextResponse; user: { id: string } | null; isStaff?: boolean; isAdmin?: boolean; isSuperAdmin?: boolean }> {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let isStaff: boolean | undefined;
  let isAdmin: boolean | undefined;
  let isSuperAdmin: boolean | undefined;
  let canImpersonate: boolean | undefined;
  if (user) {
    if (user.id === ADMIN_OWNER_ID) {
      isStaff = true;
      isAdmin = true;
      isSuperAdmin = true;
      canImpersonate = true;
    } else {
      const { data: platform } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      const platformRole = platform?.role as string | undefined;
      isSuperAdmin = platformRole === 'super-admin';
      isStaff = !!platformRole && ['ADMIN', 'EMPLOYEE', 'super-admin', 'SUPPORT', 'BILLING'].includes(platformRole);
      canImpersonate = platformRole === 'super-admin' || platformRole === 'ADMIN' || platformRole === 'SUPPORT';
      if (platformRole === 'ADMIN' || platformRole === 'super-admin') {
        isAdmin = true;
      } else {
        const { data: userRow } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        isAdmin = (userRow?.role as string) === 'ADMIN';
      }
    }
  }

  return { response, user: user ?? null, isStaff, isAdmin, isSuperAdmin, canImpersonate };
}
