import React from 'react';
import { useQuery } from '@apollo/client';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';

import { isHostAccount, isIndividualAccount } from '../../lib/collective';
import roles from '../../lib/constants/roles';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import { ALL_SECTIONS, ROOT_SECTIONS } from '../../components/dashboard/constants';
import DashboardPage from '../../components/dashboard/DashboardPage';
import { adminPanelQuery } from '../../components/dashboard/queries';
import type { DashboardSectionProps } from '../../components/dashboard/types';
import MessageBoxGraphqlError from '../../components/MessageBoxGraphqlError';

export default function DashboardIndexPage({ lastWorkspaceVisit }) {
  const Component: React.FC<DashboardSectionProps> = () => (
    <DashboardComponent lastWorkspaceVisit={lastWorkspaceVisit} />
  );

  return <DashboardPage Component={Component} slug={null} section={null} />;
}

function DashboardComponent({ lastWorkspaceVisit }) {
  const router = useRouter();

  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();

  const defaultSlug = lastWorkspaceVisit?.slug || LoggedInUser?.collective.slug;
  const activeSlug = router.query.slug || defaultSlug;

  const { data, loading, error } = useQuery(adminPanelQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser,
  });

  const account = data?.account;

  const defaultSection = getDefaultSectionForAccount(account, LoggedInUser);

  React.useEffect(() => {
    if (!activeSlug || !LoggedInUser) {
      router.replace('/');
    } else if (account) {
      router.replace(`/dashboard/${activeSlug}/${defaultSection}`);
    }
  }, [loading, loadingLoggedInUser, LoggedInUser, activeSlug, defaultSection, account, router]);

  return error ? <MessageBoxGraphqlError error={error} /> : <div />;
}

function getDefaultSectionForAccount(account, loggedInUser) {
  if (!account) {
    return null;
  } else if (account.type === 'ROOT') {
    return ROOT_SECTIONS.ALL_COLLECTIVES;
  } else if (
    isIndividualAccount(account) ||
    (!isHostAccount(account) && loggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.COLLECTIVE_OVERVIEW))
  ) {
    return ALL_SECTIONS.OVERVIEW;
  } else if (isHostAccount(account)) {
    return ALL_SECTIONS.HOST_EXPENSES;
  } else {
    const isAdmin = loggedInUser?.isAdminOfCollective(account);
    const isAccountant = loggedInUser?.hasRole(roles.ACCOUNTANT, account);
    return !isAdmin && isAccountant ? ALL_SECTIONS.PAYMENT_RECEIPTS : ALL_SECTIONS.EXPENSES;
  }
}

function getLastWorkspaceVisitClient() {
  if (typeof document !== 'undefined') {
    const valStr = document.cookie
      .split('; ')
      .find(row => row.startsWith('lastWorkspaceVisit='))
      ?.split('=')[1];

    if (valStr) {
      try {
        return JSON.parse(valStr);
      } catch {
        return null;
      }
    }
  }
}

function getLastWorkspaceVisitServer(ctx: NextPageContext) {
  if ((ctx.req as any).cookies.lastWorkspaceVisit) {
    try {
      return JSON.parse((ctx.req as any).cookies.lastWorkspaceVisit);
    } catch {
      return null;
    }
  }
}

DashboardIndexPage.getInitialProps = ctx => {
  const lastWorkspaceVisit = ctx.req ? getLastWorkspaceVisitServer(ctx) : getLastWorkspaceVisitClient();

  return {
    lastWorkspaceVisit,
  };
};
