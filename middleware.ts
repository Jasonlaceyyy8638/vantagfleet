import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup', '/invite', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Refresh Supabase session and get current user
  const { response, user } = await updateSession(request);

  // Allow public paths and auth callback without requiring user
  if (isPublic || pathname === '/') {
    return response;
  }

  // Protect all other routes: require authenticated user
  if (!user) {
    const redirect = new URL('/login', request.url);
    redirect.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
