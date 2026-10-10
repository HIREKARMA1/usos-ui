import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Account activation is optional for browsing, the dashboard, and the shop.
 * The previous payment-gate cookie must not lock members out of those routes.
 */
export function middleware(_request: NextRequest) {
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
