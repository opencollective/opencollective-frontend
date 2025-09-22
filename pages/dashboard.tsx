import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { require2FAForAdmins } from '../lib/policies';
import type { Context } from '@/lib/apollo-client';
import { isHostAccount } from '@/lib/collective';
import { loadGoogleMaps } from '@/lib/google-maps';
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
import { getMenuItems } from '../components/dashboard/Menu';
import { adminPanelQuery } from '../components/dashboard/queries';
import AdminPanelSideBar from '../components/dashboard/SideBar';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Footer from '../components/navigation/Footer';
import NotificationBar from '../components/NotificationBar';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { TwoFactorAuthRequiredMessage } from '../components/TwoFactorAuthRequiredMessage';
import { useWorkspace } from '../components/WorkspaceProvider';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';
import SearchTrigger from '@/components/SearchTrigger';
import { SearchCommand } from '@/components/search/SearchCommand';
import ProfileMenu from '@/components/navigation/ProfileMenu';

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
  } else if (loggedInUser?.isAccountantOnly(account) && isHostAccount(account)) {
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
  }
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
          defaultMessage="You need to be logged in as a community manager to view this page"
          id="dnkxQ8"
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

  const { data, loading } = useQuery(adminPanelQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser || isRootProfile,
  });
  const account = isRootProfile && isRootUser ? ROOT_PROFILE_ACCOUNT : data?.account;
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);

  // Keep track of last visited workspace account and sections
  React.useEffect(() => {
    if (activeSlug && activeSlug !== workspace.slug) {
      if (LoggedInUser) {
        setWorkspace({ slug: activeSlug });
      }
    }
    // If there is no slug set (that means /dashboard)
    // And if there is an activeSlug (this means workspace OR LoggedInUser)
    // And a LoggedInUser
    // And if activeSlug is different than LoggedInUser slug
    if (!slug && activeSlug && LoggedInUser && activeSlug !== LoggedInUser.collective.slug) {
      router.replace(`/dashboard/${activeSlug}`);
    }
  }, [activeSlug, LoggedInUser]);

  // Clear last visited workspace account if not admin
  React.useEffect(() => {
    if (account && !LoggedInUser.isAdminOfCollective(account) && !(isRootProfile && isRootUser)) {
      setWorkspace({ slug: undefined });
    }
  }, [account]);

  React.useEffect(() => {
    loadGoogleMaps();
  }, []);

  const notification = getNotification(intl, account);
  const [expandedSection, setExpandedSection] = React.useState(null);
  const isLoading = loading || loadingLoggedInUser;
  const blocker = !isLoading && getBlocker(LoggedInUser, account, selectedSection);
  const titleBase = intl.formatMessage({ id: 'Dashboard', defaultMessage: 'Dashboard' });
  const menuItems = account ? getMenuItems({ intl, account, LoggedInUser }) : [];
  const accountIdentifier = account && (account.name || `@${account.slug}`);
  const [showSearchModal, setShowSearchModal] = React.useState(false);

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
      }}
    >
      <SidebarProvider>
        {/* <Page
          noRobots
          collective={account}
          title={[accountIdentifier, titleBase].filter(Boolean).join(' - ')}
          pageTitle={titleBase}
          showFooter={false}
        > */}
        <AdminPanelSideBar isLoading={isLoading} activeSlug={activeSlug} menuItems={menuItems} />
        <div>
          <div className="sticky top-0 flex h-15 items-center justify-between bg-background px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <SearchTrigger setShowSearchModal={setShowSearchModal} />
            </div>
            {/* <div className="hidden sm:block">{!whitelabel && <ChangelogTrigger />}</div> */}
            <ProfileMenu
            // logoutParameters={{ skipQueryRefetch: onDashboardRoute, redirect: onDashboardRoute ? '/' : undefined }}
            />
          </div>
          {Boolean(notification) && <NotificationBar {...notification} />}
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
            <div>
              <div
                className="flex min-h-[600px] flex-col justify-center gap-6 md:flex-row lg:gap-12"
                data-cy="admin-panel-container"
              >
                <div className="px-4 py-6 lg:py-8 xl:px-6">
                  {LoggedInUser &&
                  require2FAForAdmins(account) &&
                  !LoggedInUser.hasTwoFactorAuth &&
                  selectedSection !== 'user-security' ? (
                    <TwoFactorAuthRequiredMessage className="lg:mt-16" />
                  ) : (
                    <div className="max-w-(--breakpoint-xl) min-w-0 flex-1">
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
            </div>
          )}
          <Footer />
        </div>
        <SearchCommand open={showSearchModal} setOpen={open => setShowSearchModal(open)} />

        {/* </Page> */}
      </SidebarProvider>
    </DashboardContext.Provider>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default DashboardPage;
