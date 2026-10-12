import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Tout est protégé sauf la page de connexion, le contrôle de santé et les routes NextAuth.
const PUBLIC_PREFIXES = ['/login', '/api/health', '/api/auth'];

export async function middleware(req) {
  if (process.env.AUTH_ENABLED === 'false') return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return new NextResponse(JSON.stringify({ error: 'Authentification requise' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const loginUrl = new URL('/login', req.url);
  if (pathname !== '/') loginUrl.searchParams.set('redirectedFrom', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|webp|ico|woff2?)$).*)'],
};
