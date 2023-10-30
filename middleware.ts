import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const rootRedirect = req.cookies.get('rootRedirect');
  const host = req.headers.get('host');
  const pathname = req.nextUrl.pathname;

  const redirectToDashboard = rootRedirect?.value === 'dashboard';

  console.log('in next.js middleware');
  console.log({ host: host, reqUrl: req.url, pathname, rootRedirect });

  if (redirectToDashboard) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}

export const config = {
  matcher: '/',
};
