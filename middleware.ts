import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup', '/invite', '/auth/callback', '/roadside/view'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Refresh Supabase session and get current user (and staff status for /admin)
  const { response, user, isStaff } = await updateSession(request, pathname);

  // Allow public paths and auth callback without requiring user
  if (isPublic || pathname === '/' || pathname === '/pricing' || pathname.startsWith('/roadside/view')) {
    return response;
  }

  // Protect all other routes: require authenticated user
  if (!user) {
    const redirect = new URL('/login', request.url);
    redirect.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirect);
  }

  // Admin portal: only ADMIN or EMPLOYEE may access; redirect others to dashboard
  if (pathname.startsWith('/admin')) {
    if (isStaff !== true) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
