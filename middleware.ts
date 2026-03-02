import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup', '/invite', '/register', '/auth/callback', '/roadside/view'];

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

  // Public API routes: no auth required
  if (pathname.startsWith('/api/update') || pathname.startsWith('/api/verify-dot')) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Refresh Supabase session and get current user (and staff status for /admin)
  const { response, user, isAdmin, isSuperAdmin } = await updateSession(request, pathname);

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

  // Super-admin impersonating: if they have impersonated_org_id cookie, let them through to dashboard (don't redirect to /admin)
  const impersonatedOrgId = request.cookies.get('impersonated_org_id')?.value;
  const carrierRoutes = ['/dashboard', '/drivers', '/vehicles', '/loads', '/compliance', '/regulatory', '/settings', '/roadside-mode'];

  if (user.id === ADMIN_OWNER_ID) {
    if (carrierRoutes.some((r) => pathname.startsWith(r)) && !impersonatedOrgId) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return response;
  }

  if (isSuperAdmin === true || isAdmin === true) {
    if (carrierRoutes.some((r) => pathname.startsWith(r)) && !impersonatedOrgId) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Admin portal: only super-admin may access (platform_roles.role = 'super-admin' or owner ID)
  if (pathname.startsWith('/admin')) {
    if (isSuperAdmin !== true) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
