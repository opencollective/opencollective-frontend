import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

export default function homeMiddleware(req: NextRequest) {
  if (req.cookies.has('rootRedirectDashboard')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
