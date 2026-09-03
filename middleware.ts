import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PAYMENT_GATE_COOKIE = 'usos_payment_gate';
const PAYMENT_PATH = '/payment';

const PROTECTED_PREFIXES = ['/user', '/admin', '/shop'];
const GUEST_PATHS = ['/login', '/register'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const gate = request.cookies.get(PAYMENT_GATE_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isPending = gate === 'pending';
  const isOk = gate === 'ok';

  if (isPending && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = PAYMENT_PATH;
    url.search = 'reason=pending';
    return NextResponse.redirect(url);
  }

  if (isPending && GUEST_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = PAYMENT_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isOk && pathname === PAYMENT_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = '/user';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user',
    '/user/:path*',
    '/admin',
    '/admin/:path*',
    '/shop',
    '/shop/:path*',
    '/login',
    '/register',
    '/payment',
  ],
};
