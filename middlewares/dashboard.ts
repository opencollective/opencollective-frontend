import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isHostAccount, isIndividualAccount } from '../lib/collective';

import { fetchGraphQLV1, getTokenFromRequest } from './utils';

export default async function dashboardMiddleware(req: NextRequest) {
  // if (req.nextUrl.searchParams.has('slug')) {
  //   return NextResponse.next();
  // }

  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  const response = await fetchGraphQLV1<{
    LoggedInUser: {
      id: number;
      isRoot: boolean;
      collective: {
        type: string;
        slug: string;
      };
      memberOf: {
        role: string;
        collective: {
          type: string;
          slug: string;
          isHost: boolean;
        };
      }[];
    };
  }>(
    {
      query: `
      query DashboardMiddlewareQuery {
        LoggedInUser {
          id
          isRoot
          collective {
            slug
            type
          }
          memberOf {
            role
            collective {
              slug
              type
              isHost
            }
          }
        }
      }
    `,
    },
    { accessToken: token },
  );

  if (!response.data?.LoggedInUser) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  const LoggedInUser = response.data.LoggedInUser;

  let lastWorkspaceVisit: { slug?: string };
  if (req.cookies.has('lastWorkspaceVisit')) {
    try {
      lastWorkspaceVisit = JSON.parse(req.cookies.get('lastWorkspaceVisit').value);
    } catch {
      /* empty */
    }
  }

  const { role, collective } = getDashboardRole(LoggedInUser, lastWorkspaceVisit?.slug);
  let section;
  if (isIndividualAccount(collective)) {
    section = 'overview';
  } else if (isHostAccount(collective)) {
    section = 'host-expenses';
  } else if (role === 'ACCOUNTANT') {
    section = 'payment-receipts';
  } else {
    section = 'expenses';
  }

  return NextResponse.redirect(new URL(`/dashboard/${collective.slug}/${section}`, req.url));
}

function getDashboardRole(
  LoggedInUser,
  slug,
): { collective: { slug: string; type: string; isHost?: boolean }; role: string } {
  let role = {
    collective: { slug: LoggedInUser.collective.slug, type: 'INDIVIDUAL' },
    role: 'ADMIN',
  };
  if (!slug || slug === LoggedInUser.collective.slug) {
    return role;
  }

  const roles = (LoggedInUser.memberOf || []).filter(a => a.collective.slug === slug);
  if (!roles || roles.length === 0) {
    return role;
  }

  role = roles.find(a => a.role === 'ADMIN');
  role = role || roles.find(a => a.role === 'ACCOUNTANT');
  return role;
}
