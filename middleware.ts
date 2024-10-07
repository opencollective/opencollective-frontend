import { type NextRequest, NextResponse } from 'next/server';

import dashboardMiddleware from './middlewares/dashboard';
import homeMiddleware from './middlewares/home';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname === '/') {
    return homeMiddleware(req);
  } else if (pathname === '/dashboard') {
    return dashboardMiddleware(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', { source: '/dashboard', missing: [{ type: 'query', key: 'slug' }] }],
};
