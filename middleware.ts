import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup', '/invite', '/register', '/auth/callback', '/roadside/view', '/inspect'];

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
  if (
    pathname.startsWith('/api/update') ||
    pathname.startsWith('/api/verify-dot') ||
    pathname.startsWith('/api/verify-mc') ||
    pathname.startsWith('/api/signup-lead')
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  let response: NextResponse;
  let user: { id: string } | null = null;
  let isStaff: boolean | undefined;
  let isAdmin: boolean | undefined;
  let isSuperAdmin: boolean | undefined;

  try {
    const session = await updateSession(request, pathname);
    response = session.response;
    user = session.user;
    isStaff = session.isStaff;
    isAdmin = session.isAdmin;
    isSuperAdmin = session.isSuperAdmin;
  } catch {
    response = NextResponse.next({ request });
  }

  const demoCookie = request.cookies.get('vf_demo')?.value === '1';
  const demoQuery =
    url.searchParams.get('demo') === 'true' || url.searchParams.get('mode') === 'demo';

  const isCarrierSandboxPath = (p: string) => {
    const roots = [
      '/dashboard',
      '/dispatch',
      '/drivers',
      '/vehicles',
      '/loads',
      '/customers',
      '/settlements',
      '/compliance',
      '/regulatory',
      '/settings',
      '/documents',
      '/trailers',
      '/roadside-mode',
      '/profile',
    ];
    return roots.some((r) => p === r || p.startsWith(`${r}/`));
  };

  /** First hit with ?mode=demo on any sandbox route sets cookies (not only /dashboard). */
  const shouldSeedDemoCookies = demoQuery && isCarrierSandboxPath(pathname);

  const isUnauthenticatedDemo =
    isCarrierSandboxPath(pathname) && (demoCookie || demoQuery);

  // Allow public paths and auth callback without requiring user
  if (
    isPublic ||
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/contact' ||
    pathname === '/download' ||
    pathname.startsWith('/releases') ||
    pathname.startsWith('/roadside/view') ||
    pathname.startsWith('/inspect/') ||
    pathname.startsWith('/forgot-password') ||
    isUnauthenticatedDemo
  ) {
    if (shouldSeedDemoCookies) {
      response.cookies.set('vf_demo', '1', { path: '/', maxAge: 1800, sameSite: 'lax' });
      const roleParam = url.searchParams.get('role');
      if (roleParam === 'broker' || roleParam === 'carrier') {
        response.cookies.set('vf_demo_role', roleParam, { path: '/', maxAge: 1800, sameSite: 'lax' });
      }
    }
    return response;
  }

  // Protect all other routes: require authenticated user
  if (!user) {
    const redirect = new URL('/login', request.url);
    redirect.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirect);
  }

  // Owner can use carrier routes (their own org dashboard); only other staff are redirected to /admin when not impersonating
  const impersonatedOrgId = request.cookies.get('impersonated_org_id')?.value;
  const carrierRoutes = ['/dashboard', '/drivers', '/vehicles', '/loads', '/compliance', '/regulatory', '/settings', '/roadside-mode', '/dispatcher', '/trailers'];

  if (user.id === ADMIN_OWNER_ID) {
    return response;
  }

  // Staff (not owner): when not impersonating, carrier routes redirect to /admin
  if (isStaff === true && carrierRoutes.some((r) => pathname.startsWith(r)) && !impersonatedOrgId) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Admin portal: any platform staff may access
  if (pathname.startsWith('/admin')) {
    if (isStaff !== true) {
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
