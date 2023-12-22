import React from 'react';
import { useQuery } from '@apollo/client';
import { clsx } from 'clsx';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { isHostAccount, isIndividualAccount } from '../lib/collective.lib';
import roles from '../lib/constants/roles';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLocalStorage from '../lib/hooks/useLocalStorage';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { require2FAForAdmins } from '../lib/policies';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';

import { ALL_SECTIONS, SECTIONS_ACCESSIBLE_TO_ACCOUNTANTS } from '../components/dashboard/constants';
import { DashboardContext } from '../components/dashboard/DashboardContext';
import DashboardSection from '../components/dashboard/DashboardSection';
import { getMenuItems } from '../components/dashboard/Menu';
import DashboardTopBar from '../components/dashboard/preview/DashboardTopBar';
import SubMenu from '../components/dashboard/preview/SubMenu';
import { dashboardQuery } from '../components/dashboard/queries';
import AdminPanelSideBar from '../components/dashboard/SideBar';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Footer from '../components/navigation/Footer';
import NotificationBar from '../components/NotificationBar';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { TwoFactorAuthRequiredMessage } from '../components/TwoFactorAuthRequiredMessage';

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
  } else if (isIndividualAccount(account)) {
    return ALL_SECTIONS.OVERVIEW;
  } else if (isHostAccount(account)) {
    return ALL_SECTIONS.HOST_EXPENSES;
  } else {
    const isAdmin = loggedInUser?.isAdminOfCollective(account);
    const isAccountant = loggedInUser?.hasRole(roles.ACCOUNTANT, account);
    return !isAdmin && isAccountant ? ALL_SECTIONS.PAYMENT_RECEIPTS : ALL_SECTIONS.EXPENSES;
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
    return <FormattedMessage defaultMessage="This account doesn't exist" />;
  } else if (account.isIncognito) {
    return <FormattedMessage defaultMessage="You cannot edit this collective" />;
  }

  // Check permissions
  const isAdmin = LoggedInUser.isAdminOfCollective(account);
  if (SECTIONS_ACCESSIBLE_TO_ACCOUNTANTS.includes(section)) {
    if (!isAdmin && !LoggedInUser.hasRole(roles.ACCOUNTANT, account)) {
      return <FormattedMessage defaultMessage="You need to be logged in as an admin or accountant to view this page" />;
    }
  } else if (!isAdmin) {
    return <FormattedMessage defaultMessage="You need to be logged in as an admin" />;
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
    subpath: getAsArray(query.subpath),
  };
};

const DashboardPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const { slug, section, subpath } = parseQuery(router.query);
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const [lastWorkspaceVisit, setLastWorkspaceVisit] = useLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE, {
    slug: LoggedInUser?.collective.slug,
  });

  const defaultSlug = lastWorkspaceVisit.slug || LoggedInUser?.collective.slug;
  const activeSlug = slug || defaultSlug;

  const { data, loading } = useQuery(dashboardQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser,
  });
  const account = data?.account;
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);

  const useDynamicTopBar = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DYNAMIC_TOP_BAR);

  // Keep track of last visited workspace account and sections
  React.useEffect(() => {
    if (activeSlug && activeSlug !== lastWorkspaceVisit.slug) {
      if (LoggedInUser && !useDynamicTopBar) {
        // this is instead configured as "default" account in NewAccountSwitcher
        setLastWorkspaceVisit({ slug: activeSlug });
      }
    }
    // If there is no slug set (that means /dashboard)
    // And if there is an activeSlug (this means lastWorkspaceVisit OR LoggedInUser)
    // And a LoggedInUser
    // And if activeSlug is different than LoggedInUser slug
    if (!slug && activeSlug && LoggedInUser && activeSlug !== LoggedInUser.collective.slug) {
      router.replace(`/dashboard/${activeSlug}`);
    }
  }, [activeSlug, LoggedInUser]);

  // Clear last visited workspace account if not admin
  React.useEffect(() => {
    if (account && !LoggedInUser.isAdminOfCollective(account)) {
      setLastWorkspaceVisit({ slug: null });
    }
  }, [account]);

  const notification = getNotification(intl, account);
  const [expandedSection, setExpandedSection] = React.useState(null);
  const isLoading = loading || loadingLoggedInUser;
  const blocker = !isLoading && getBlocker(LoggedInUser, account, selectedSection);
  const titleBase = intl.formatMessage({ id: 'Dashboard', defaultMessage: 'Dashboard' });
  const menuItems = account ? getMenuItems({ intl, account, LoggedInUser }) : [];

  let subMenu = null;
  const parentMenuItem = menuItems.find(
    item => 'subMenu' in item && item.subMenu?.find(item => item.section === selectedSection),
  );
  if (parentMenuItem && 'subMenu' in parentMenuItem) {
    subMenu = parentMenuItem.subMenu;
  }

  return (
    <DashboardContext.Provider
      value={{
        selectedSection,
        expandedSection,
        setExpandedSection,
        account,
        activeSlug,
        defaultSlug,
        setDefaultSlug: slug => setLastWorkspaceVisit({ slug }),
      }}
    >
      <div className="flex min-h-screen flex-col justify-between">
        <Page
          noRobots
          collective={account}
          title={account ? `${account.name} - ${titleBase}` : titleBase}
          pageTitle={titleBase}
          showFooter={false}
        >
          {Boolean(notification) && <NotificationBar {...notification} />}
          {blocker ? (
            <div className="my-32 flex flex-col items-center">
              <MessageBox type="warning" mb={4} maxWidth={400} withIcon>
                <p>{blocker}</p>
                {LoggedInUser && (
                  <Link className="mt-2 block" href={`/dashboard/${LoggedInUser.collective.slug}`}>
                    <FormattedMessage defaultMessage="Go to your Dashboard" />
                  </Link>
                )}
              </MessageBox>
              {!LoggedInUser && <SignInOrJoinFree form="signin" disableSignup />}
            </div>
          ) : !useDynamicTopBar ? (
            <div
              className="flex min-h-[600px] flex-col justify-center gap-6 px-4 py-6 md:flex-row md:px-6 lg:gap-12 lg:py-8"
              data-cy="admin-panel-container"
            >
              <AdminPanelSideBar isLoading={isLoading} activeSlug={activeSlug} menuItems={menuItems} />
              {LoggedInUser && require2FAForAdmins(account) && !LoggedInUser.hasTwoFactorAuth ? (
                <TwoFactorAuthRequiredMessage className="lg:mt-16" />
              ) : (
                <div className="max-w-[1000px] flex-1 px-1 sm:overflow-x-clip">
                  <DashboardSection
                    section={selectedSection}
                    isLoading={isLoading}
                    account={account}
                    subpath={subpath}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className={'flex min-h-[600px] flex-col items-stretch gap-6 pb-10'} data-cy="admin-panel-container">
              <DashboardTopBar isLoading={isLoading} account={account} menuItems={menuItems} />

              {LoggedInUser && require2FAForAdmins(account) && !LoggedInUser.hasTwoFactorAuth ? (
                <TwoFactorAuthRequiredMessage className="lg:mt-16" />
              ) : (
                <div
                  className={clsx(
                    'mx-auto grid w-full max-w-screen-2xl grid-cols-1 justify-center px-3 md:px-6',
                    ['host-transactions', 'transactions'].includes(selectedSection) && // TODO: fix better support for wider pages
                      LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_TRANSACTION_PAGE)
                      ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1536px)_minmax(0,1fr)]'
                      : subMenu
                        ? 'lg:grid-cols-[minmax(200px,1fr)_minmax(0,1024px)_minmax(0,1fr)]'
                        : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1024px)_minmax(0,1fr)]',
                  )}
                >
                  {subMenu ? (
                    <SubMenu
                      className="mb-4 lg:mr-4"
                      subMenu={subMenu}
                      account={account}
                      selectedSection={selectedSection}
                    />
                  ) : (
                    <div />
                  )}

                  <DashboardSection
                    section={selectedSection}
                    isLoading={isLoading}
                    account={account}
                    subpath={subpath}
                  />
                </div>
              )}
            </div>
          )}
        </Page>
        <Footer />
      </div>
    </DashboardContext.Provider>
  );
};

DashboardPage.getInitialProps = () => {
  return {
    scripts: { googleMaps: true }, // TODO: This should be enabled only for events
  };
};

export default DashboardPage;
