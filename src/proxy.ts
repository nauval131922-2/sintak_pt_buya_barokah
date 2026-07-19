import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ponytail: global auth guard — protect /api/* + /dashboard/* + all pages
// except whitelisted public routes. Middleware can't use next/headers cookies(),
// so we read the cookie from req and verify JWT manually (same secret as lib/session.ts).

const SESSION_COOKIE = 'sintak_session';

// Routes that must stay public (no session required)
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/me',
  '/api/telegram',
  '/api/webhook',
  '/_next',
  '/favicon',
  '/fonts',
  '/icons',
  '/manifest',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('[middleware] SESSION_SECRET not set');
    return false;
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Allow public assets / whitelisted routes through
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const valid = await verifySession(token);

  if (!valid) {
    // API request -> 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Page request -> redirect to login (preserve attempted URL)
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static files (images, css, js handled by /_next above)
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico (static assets)
     * - files with extension (.*\\..*)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
