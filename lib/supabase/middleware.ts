import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(
  request: NextRequest,
  pathname?: string
): Promise<{ response: NextResponse; user: { id: string } | null; isStaff?: boolean; isAdmin?: boolean }> {
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
  if (user) {
    const { data: platform } = await supabase
      .from('platform_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    const platformRole = platform?.role;
    isStaff = !!platformRole && (platformRole === 'ADMIN' || platformRole === 'EMPLOYEE');
    if (platformRole === 'ADMIN') {
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

  return { response, user: user ?? null, isStaff, isAdmin };
}
