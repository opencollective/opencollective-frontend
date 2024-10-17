import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// config file
// ts-unused-exports:disable-next-line
export function middleware(req: NextRequest) {
  // Note: only need to check presence rootRedirectDashboard cookie, not its value
  const redirectToDashboard = req.cookies.get('rootRedirectDashboard');

  if (redirectToDashboard) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

// config file
// ts-unused-exports:disable-next-line
export const config = {
  matcher: '/',
};
