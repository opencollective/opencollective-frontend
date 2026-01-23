import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { require2FAForAdmins } from '../lib/policies';
import type { Context } from '@/lib/apollo-client';
import { CollectiveType } from '@/lib/constants/collectives';
import type { DashboardQuery } from '@/lib/graphql/types/v2/graphql';
import type LoggedInUser from '@/lib/LoggedInUser';
import { getDashboardRoute } from '@/lib/url-helpers';
import { getWhitelabelProps } from '@/lib/whitelabel';

import {
  ALL_SECTIONS,
  ROOT_PROFILE_ACCOUNT,
  ROOT_PROFILE_KEY,
  ROOT_SECTIONS,
  SECTIONS_ACCESSIBLE_TO_ACCOUNTANTS,
  SECTIONS_ACCESSIBLE_TO_COMMUNITY_MANAGERS,
} from '../components/dashboard/constants';
import { DashboardContext } from '../components/dashboard/DashboardContext';
import DashboardSection from '../components/dashboard/DashboardSection';
import { adminPanelQuery } from '../components/dashboard/queries';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Footer from '../components/navigation/Footer';
import NotificationBar from '../components/NotificationBar';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { TwoFactorAuthRequiredMessage } from '../components/TwoFactorAuthRequiredMessage';
import { useWorkspace } from '../components/WorkspaceProvider';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import ErrorPage from '@/components/ErrorPage';
import Header from '@/components/Header';
import I18nFormatters from '@/components/I18nFormatters';
import { SidebarInset, SidebarProvider } from '@/components/ui/Sidebar';

const messages = defineMessages({
  collectiveIsArchived: {
    id: 'collective.isArchived',
    defaultMessage: '{name} has been archived.',
  },
  collectiveIsArchivedDescription: {
    id: 'collective.isArchived.edit.description',
    defaultMessage: 'This {type} has been archived and is no longer active.',
  },
  userIsArchived: {
    id: 'user.isArchived',
    defaultMessage: 'Account has been archived.',
  },
  userIsArchivedDescription: {
    id: 'user.isArchived.edit.description',
    defaultMessage: 'This account has been archived and is no longer active.',
  },
});

const getDefaultSectionForAccount = (account, loggedInUser) => {
  if (!account) {
    return null;
  } else if (account.type === 'ROOT') {
    return ROOT_SECTIONS.ALL_COLLECTIVES;
  } else if (loggedInUser?.isAccountantOnly(account) && account.hasHosting) {
    return ALL_SECTIONS.HOST_EXPENSES;
  } else if (loggedInUser?.isAccountantOnly(account)) {
    return ALL_SECTIONS.PAYMENT_RECEIPTS;
  } else {
    return ALL_SECTIONS.OVERVIEW;
  }
};

const getNotification = (intl, account) => {
  if (account?.isArchived) {
    if (account.type === 'USER') {
      return {
        type: 'warning',
        title: intl.formatMessage(messages.userIsArchived),
        description: intl.formatMessage(messages.userIsArchivedDescription),
      };
    } else {
      return {
        type: 'warning',
        title: intl.formatMessage(messages.collectiveIsArchived, { name: account.name }),
        description: intl.formatMessage(messages.collectiveIsArchivedDescription, {
          type: account.type.toLowerCase(),
        }),
      };
    }
  } else if (account?.type === CollectiveType.COLLECTIVE) {
    if (!account?.host) {
      return {
        type: 'error',
        inline: true,
        title: (
          <React.Fragment>
            <FormattedMessage
              defaultMessage="You have not applied to any fiscal host. You can not raise funds without a fiscal host."
              id="Dashboard.NoHostNotification"
            />
            <Link
              href={`/${account.slug}/accept-financial-contributions/host`}
              className="ml-1 inline-flex items-center underline hover:no-underline"
            >
              <FormattedMessage defaultMessage="Find a Fiscal Host" id="join.findAFiscalHost" />
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </React.Fragment>
        ),
      };
    }
    if (account?.hostApplication?.status === 'PENDING') {
      return {
        type: 'info',
        inline: true,
        title: (
          <React.Fragment>
            <span className="font-normal">
              <FormattedMessage
                defaultMessage="You applied to be hosted by <strong>{hostName}</strong> on <strong>{applicationData, date, medium}</strong>. Your application is being reviewed."
                id="Dashboard.PendingHostApplicationNotification"
                values={{
                  ...I18nFormatters,
                  hostName: account?.host.name,
                  applicationData: new Date(account?.hostApplication.createdAt),
                }}
              />
            </span>
            <Link
              href={getDashboardRoute(account, `/host?hostApplicationId=${account.hostApplication.id}`)}
              className="ml-1 inline-flex items-center underline hover:no-underline"
            >
              <FormattedMessage
                defaultMessage="See Application"
                id="Dashboard.PendingHostApplicationNotificationLink"
              />
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </React.Fragment>
        ),
      };
    }
  }
};

/**
 * Get the People dashboard detail URL for an individual account within the context of a dashboard account
 * If the user is not an admin of the host account, return the public profile URL instead
 */
const getProfileUrl = (
  loggedInUser: LoggedInUser,
  contextAccount: DashboardQuery['account'],
  account: { id: string; slug: string; type: string },
) => {
  if (!contextAccount) {
    return null;
  }
  const context =
    'host' in contextAccount && loggedInUser?.isAdminOfCollective(contextAccount.host)
      ? contextAccount.host
      : contextAccount.isHost
        ? contextAccount
        : null;

  if (context && typeof account?.id === 'string') {
    if (account?.type === CollectiveType.INDIVIDUAL) {
      return getDashboardRoute({ slug: context.slug }, `people/${account?.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ([CollectiveType.VENDOR, CollectiveType.ORGANIZATION].includes(account?.type as any)) {
      return getDashboardRoute({ slug: context.slug }, `vendors/${account?.id}`);
    }
  }
  return null;
};

function getBlocker(LoggedInUser, account, section) {
  if (!LoggedInUser) {
    return <FormattedMessage id="mustBeLoggedIn" defaultMessage="You must be logged in to see this page" />;
  } else if (!account) {
    return <FormattedMessage defaultMessage="This account doesn't exist" id="3ABdi3" />;
  } else if (account.isIncognito) {
    return <FormattedMessage defaultMessage="You cannot edit this collective" id="ZonfjV" />;
  } else if (account.type === 'ROOT' && LoggedInUser.isRoot) {
    return;
  }

  // Check permissions
  const isAdmin = LoggedInUser.isAdminOfCollective(account);
  if (SECTIONS_ACCESSIBLE_TO_ACCOUNTANTS.includes(section)) {
    if (!isAdmin && !LoggedInUser.hasRole(roles.ACCOUNTANT, account)) {
      return (
        <FormattedMessage
          defaultMessage="You need to be logged in as an admin or accountant to view this page"
          id="9FWGOh"
        />
      );
    }
  } else if (SECTIONS_ACCESSIBLE_TO_COMMUNITY_MANAGERS.includes(section)) {
    if (!isAdmin && !LoggedInUser.hasRole(roles.COMMUNITY_MANAGER, account)) {
      return (
        <FormattedMessage
          defaultMessage="You need to be logged in as an admin or a community manager to view this page"
          id="BduqMQ"
        />
      );
    }
  } else if (!isAdmin) {
    return <FormattedMessage defaultMessage="You need to be logged in as an admin" id="AQNF/n" />;
  }
}

function getSingleParam(queryParam: string | string[]): string {
  return Array.isArray(queryParam) ? queryParam[0] : queryParam;
}

function getAsArray(queryParam: string | string[]): string[] {
  return Array.isArray(queryParam) ? queryParam : [queryParam];
}

const parseQuery = query => {
  return {
    slug: getSingleParam(query.slug),
    section: getSingleParam(query.section),
    subpath: getAsArray(query.subpath)?.filter(Boolean),
  };
};

// ts-unused-exports:disable-next-line
export const getServerSideProps = async (context: Context) => {
  const whitelabel = getWhitelabelProps(context);
  // Dashboard should always be opened on the platform domain
  if (whitelabel.isWhitelabelDomain) {
    return {
      redirect: {
        destination: process.env.WEBSITE_URL + (whitelabel.path || '/dashboard'),
        permanent: false,
      },
    };
  }

  return { props: {} };
};

const DashboardPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const { slug, section, subpath } = parseQuery(router.query);
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const { workspace, setWorkspace } = useWorkspace();
  const isRootUser = LoggedInUser?.isRoot;
  const defaultSlug = workspace.slug || LoggedInUser?.collective.slug;
  const activeSlug = slug || defaultSlug;
  const isRootProfile = activeSlug === ROOT_PROFILE_KEY;

  const { data, loading, error } = useQuery(adminPanelQuery, {
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser || isRootProfile,
  });
  const account = isRootProfile && isRootUser ? ROOT_PROFILE_ACCOUNT : data?.account;
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);

  // Keep track of last visited workspace account and sections
  React.useEffect(() => {
    if (activeSlug) {
      if (LoggedInUser) {
        const membership = LoggedInUser.memberOf.find(val => val.collective.slug === activeSlug);
        setWorkspace({ slug: activeSlug, isHost: membership?.collective.isHost });
      }
    }
    // If there is no slug set (that means /dashboard)
    // And if there is an activeSlug (this means workspace OR LoggedInUser)
    // And a LoggedInUser
    // And if activeSlug is different than LoggedInUser slug
    if (!slug && activeSlug && LoggedInUser && activeSlug !== LoggedInUser.collective.slug) {
      router.replace(`/dashboard/${activeSlug}`);
    }
    if (router.route !== '/signup' && LoggedInUser?.requiresProfileCompletion) {
      router.replace('/signup/profile');
    }
    // If slug is `me` and there is a LoggedInUser, redirect to the user's dashboard
    if (slug === 'me' && LoggedInUser) {
      router.replace(`/dashboard/${LoggedInUser.collective.slug}${section ? `/${section}` : ''}`);
    }
  }, [activeSlug, LoggedInUser]);

  // Clear last visited workspace account if not admin
  React.useEffect(() => {
    if (account && !LoggedInUser.isAdminOfCollective(account) && !(isRootProfile && isRootUser)) {
      setWorkspace({ slug: undefined });
    }
  }, [account]);

  const notification = getNotification(intl, account);
  const [expandedSection, setExpandedSection] = React.useState(null);
  const isLoading = loading || loadingLoggedInUser;
  const blocker = !isLoading && getBlocker(LoggedInUser, account, selectedSection);
  const titleBase = intl.formatMessage({ id: 'Dashboard', defaultMessage: 'Dashboard' });
  const accountIdentifier = account && (account.name || `@${account.slug}`);

  if (!loading && !account && error) {
    return <ErrorPage error={error} />;
  }

  return (
    <DashboardContext.Provider
      value={{
        selectedSection,
        subpath: subpath || [],
        expandedSection,
        setExpandedSection,
        account,
        activeSlug,
        defaultSlug,
        setDefaultSlug: slug => setWorkspace({ slug }),
        getProfileUrl: targetAccount => getProfileUrl(LoggedInUser, account, targetAccount),
      }}
    >
      <Header
        title={[accountIdentifier, titleBase].filter(Boolean).join(' - ')}
        noRobots
        collective={account}
        withTopBar={Boolean(blocker)}
        showMenuItems={false}
      />
      {blocker ? (
        <div className="my-32 flex flex-col items-center">
          <MessageBox type="warning" mb={4} maxWidth={400} withIcon>
            <p>{blocker}</p>
            {LoggedInUser && (
              <Link className="mt-2 block" href={`/dashboard/${LoggedInUser.collective.slug}`}>
                <FormattedMessage defaultMessage="Go to your Dashboard" id="cLaG6g" />
              </Link>
            )}
          </MessageBox>
          {!LoggedInUser && <SignInOrJoinFree defaultForm="signin" disableSignup />}
        </div>
      ) : (
        <SidebarProvider>
          <DashboardSidebar isLoading={isLoading} />
          <SidebarInset className="min-w-0">
            <DashboardTopbar />
            {Boolean(notification) && <NotificationBar {...notification} />}
            <div className="flex-1 px-3 md:px-6">
              <div
                className="flex min-h-[600px] flex-1 flex-col justify-center gap-6 pt-6 pb-12 md:flex-row lg:gap-12 lg:pt-8"
                data-cy="admin-panel-container"
              >
                {LoggedInUser &&
                require2FAForAdmins(account) &&
                !LoggedInUser.hasTwoFactorAuth &&
                selectedSection !== 'user-security' ? (
                  <TwoFactorAuthRequiredMessage className="lg:mt-16" />
                ) : (
                  <div className="max-w-(--breakpoint-xl) min-w-0 flex-1 2xl:max-w-(--breakpoint-2xl)">
                    <DashboardSection
                      section={selectedSection}
                      isLoading={isLoading}
                      account={account}
                      subpath={subpath}
                    />
                  </div>
                )}
              </div>
            </div>
            <Footer isDashboard />
          </SidebarInset>
        </SidebarProvider>
      )}
    </DashboardContext.Provider>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default DashboardPage;
