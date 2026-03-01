import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup', '/invite', '/auth/callback', '/roadside/view'];

/** VantagFleet owner: always send to /admin; bypass carrier onboarding. */
const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { pathname } = url;

  // Email confirmation / magic link: Supabase redirects to Site URL with ?code=...
  // Send them to /auth/callback so the code gets exchanged for a session.
  const code = url.searchParams.get('code');
  if (code && pathname !== '/auth/callback') {
    const callback = new URL('/auth/callback', request.url);
    callback.searchParams.set('code', code);
    // Default redirectTo; owner/admin will be sent to /admin by middleware after session exists
    callback.searchParams.set('redirectTo', '/dashboard');
    return NextResponse.redirect(callback);
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Refresh Supabase session and get current user (and staff status for /admin)
  const { response, user, isAdmin } = await updateSession(request, pathname);

  // Allow public paths and auth callback without requiring user
  if (isPublic || pathname === '/' || pathname === '/pricing' || pathname === '/privacy' || pathname === '/terms' || pathname === '/contact' || pathname === '/download' || pathname.startsWith('/releases') || pathname.startsWith('/roadside/view')) {
    return response;
  }

  // Protect all other routes: require authenticated user
  if (!user) {
    const redirect = new URL('/login', request.url);
    redirect.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirect);
  }

  // Owner exception: bypass ALL organization/DOT checks; send straight to /admin for any carrier route
  if (user.id === ADMIN_OWNER_ID) {
    const carrierRoutes = ['/dashboard', '/drivers', '/vehicles', '/loads', '/compliance', '/regulatory', '/settings', '/roadside-mode'];
    if (carrierRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Allow /admin and all /admin/* for owner (isAdmin is set in updateSession)
    return response;
  }

  // Any Admin (role from platform_roles or users): allow /admin; never require org_id or onboarding
  if (isAdmin === true) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/drivers') || pathname.startsWith('/vehicles') || pathname.startsWith('/loads') || pathname.startsWith('/compliance') || pathname.startsWith('/regulatory') || pathname.startsWith('/settings') || pathname.startsWith('/roadside-mode')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Admin portal: only ADMIN may access; redirect others to home
  if (pathname.startsWith('/admin')) {
    if (isAdmin !== true) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
