import React from 'react';
import { useQuery } from '@apollo/client';
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
import AdminPanelSection from '../components/dashboard/DashboardSection';
import { adminPanelQuery } from '../components/dashboard/queries';
import AdminPanelSideBar from '../components/dashboard/SideBar';
import TopBar from '../components/dashboard/TopBar';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import Footer from '../components/navigation/Footer';
import NotificationBar from '../components/NotificationBar';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { TwoFactorAuthRequiredMessage } from '../components/TwoFactorAuthRequiredMessage';
import clsx from 'clsx';
import { getDashboardRoute } from '../lib/url-helpers';
import {
  ArrowRightLeft,
  BarChart2,
  Building,
  Coins,
  CreditCard,
  FileText,
  Hotel,
  LayoutDashboard,
  Network,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
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
    return ALL_SECTIONS.DASHBOARD_OVERVIEW;
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

const arrayWithChildren = [
  {
    section: 'EXPENSES',
    children: [
      {
        section: 'HOSTED',
      },
      {
        section: 'PENDING',
      },
    ],
  },
  {
    section: 'CONTRUBUTIONS',
    children: [
      {
        section: 'INCOMING',
      },
      {
        section: 'PAID',
      },
    ],
  },
];

const result = [
  {
    section: 'EXPENSES',
    children: [
      {
        section: 'HOSTED',
      },
      {
        section: 'PENDING',
      },
    ],
  },
  {
    section: 'HOSTED',
    parent: 'EXPENSES',
  },
  {
    section: 'PENDING',
    parent: 'EXPENSES',
  },
  {
    section: 'CONTRUBUTIONS',
    children: [
      {
        section: 'INCOMING',
      },
      {
        section: 'PAID',
      },
    ],
  },
  {
    section: 'INCOMING',
    parent: 'CONTRUBUTIONS',
  },
  {
    section: 'PAID',
    parent: 'CONTRUBUTIONS',
  },
];

const isRouteActive = (route, router) => {
  const regex = new RegExp(`^${route}(/?.*)?$`);
  return regex.test(router.asPath);
};
const getMenuItems = (intl, account) => {
  const isHost = isHostAccount(account);
  // const isUserHost = account.isHost === true && isType(account, USER); // for legacy compatibility for users who are hosts
  const isIndividual = isIndividualAccount(account);
  const menuItems = [
    {
      label: 'Overview',
      section: ALL_SECTIONS.DASHBOARD_OVERVIEW,
      href: getDashboardRoute(account, 'overview'),
      Icon: LayoutDashboard,
    },
    {
      label: 'Expenses',
      section: isHost ? ALL_SECTIONS.HOST_EXPENSES : ALL_SECTIONS.EXPENSES,
      href: getDashboardRoute(account, isHost ? 'host-expenses' : 'expenses'),
      Icon: Receipt,
    },
    // host tools
    {
      label: 'Contributions',
      section: ALL_SECTIONS.FINANCIAL_CONTRIBUTIONS,
      href: getDashboardRoute(account, 'orders'),
      Icon: Coins,
      if: isHost,
    },
    {
      label: 'Collectives',
      sections: [ALL_SECTIONS.HOSTED_COLLECTIVES, ALL_SECTIONS.HOST_APPLICATIONS],
      href: getDashboardRoute(account, 'hosted-collectives'),
      Icon: Building,
      if: isHost,
      subMenu: [
        {
          label: 'Hosted Collectives',
          section: ALL_SECTIONS.HOSTED_COLLECTIVES,
          href: getDashboardRoute(account, 'hosted-collectives'),
        },
        {
          label: 'Applications',
          section: ALL_SECTIONS.HOST_APPLICATIONS,
          href: getDashboardRoute(account, 'host-applications'),
          badge: 15,
        },
      ],
    },
    {
      label: 'Virtual Cards',
      sections: [ALL_SECTIONS.HOST_VIRTUAL_CARDS, ALL_SECTIONS.HOST_VIRTUAL_CARD_REQUESTS],
      href: getDashboardRoute(account, 'host-virtual-cards'),
      Icon: CreditCard,
      if: isHost,
      subMenu: [
        {
          label: 'Virtual Cards',
          section: ALL_SECTIONS.HOST_VIRTUAL_CARDS,
          href: getDashboardRoute(account, 'host-virtual-cards'),
        },
        {
          label: 'Requests',
          section: ALL_SECTIONS.HOST_VIRTUAL_CARD_REQUESTS,
          href: getDashboardRoute(account, 'host-virtual-card-requests'),
        },
      ],
    },
    {
      label: 'Reports',
      section: ALL_SECTIONS.REPORTS,
      href: getDashboardRoute(account, 'reports'),
      Icon: BarChart2,
      if: isHost,
    },
    {
      label: 'Agreements',
      section: ALL_SECTIONS.HOST_AGREEMENTS,
      href: getDashboardRoute(account, 'host-agreements'),
      Icon: FileText,
      if: isHost,
    },

    {
      label: 'Contributors',
      section: ALL_SECTIONS.CONTRIBUTORS,
      href: getDashboardRoute(account, 'contributors'),
      Icon: Users,
      if: !isIndividual && !isHost,
    },
    {
      label: 'Contributions',
      section: ALL_SECTIONS.CONTRIBUTIONS,
      href: getDashboardRoute(account, 'contributions'),
      Icon: Coins,
      if: !isHost,
    },
    {
      label: 'Transactions',
      section: ALL_SECTIONS.TRANSACTIONS,
      href: getDashboardRoute(account, 'transactions'),
      Icon: ArrowRightLeft,
    },
    {
      label: 'Settings',
      sections: [ALL_SECTIONS.INFO, ALL_SECTIONS.COLLECTIVE_PAGE],
      href: getDashboardRoute(account, 'info'),
      Icon: Settings,
      subMenu: [
        {
          label: 'Info',
          section: ALL_SECTIONS.INFO,
          href: getDashboardRoute(account, 'info'),
        },
        {
          label: 'Profile page',
          section: ALL_SECTIONS.COLLECTIVE_PAGE,
          href: getDashboardRoute(account, ALL_SECTIONS.COLLECTIVE_PAGE),
        },
      ],
    },
  ];

  const filteredItems = menuItems.filter(route => route.if !== false);

  const flatArray = filteredItems.flatMap(item => {
    // Create an array for the parent and its transformed children
    const transformedChildren = item.subMenu?.map(child => ({
      section: child.section,
      parent: item.section,
    }));

    // Return the parent followed by its transformed children
    return [item, ...(transformedChildren ?? [])];
  });
  // const filteredItemsWithActiveState = filteredItems.map(item => {

  //   return {
  //     ...item,
  //     isActive: isRouteActive(item.href, router),
  //   };
  // }
  return {
    menuItems: filteredItems,
    allItems: flatArray,
  };
  // .map(item => ({
  //   ...item,
  //   isActive: isRouteActive(item.href, router),
  // }));
};
const DashboardPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const { slug, section, subpath } = parseQuery(router.query);
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const [lastWorkspaceVisit, setLastWorkspaceVisit] = useLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE, {
    slug: LoggedInUser?.collective.slug,
  });

  const activeSlug = slug || lastWorkspaceVisit.slug || LoggedInUser?.collective.slug;

  const { data, loading } = useQuery(adminPanelQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug || !LoggedInUser,
  });
  const account = data?.account;
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);

  // Keep track of last visited workspace account and sections
  React.useEffect(() => {
    if (activeSlug && activeSlug !== lastWorkspaceVisit.slug) {
      setLastWorkspaceVisit({ slug: activeSlug });
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
  const useHorizontalNav = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.BREADCRUMB_NAV);
  const { menuItems, allItems } = account ? getMenuItems(intl, account) : { menuItems: [], allItems: [] };

  const subMenu = allItems.find(item => item.sections?.includes(selectedSection))?.subMenu;

  return (
    <DashboardContext.Provider value={{ selectedSection, expandedSection, setExpandedSection, account }}>
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
        ) : (
          <div
            className={clsx(
              'flex min-h-[600px] flex-col ',
              useHorizontalNav
                ? 'items-stretch justify-between gap-6'
                : 'justify-center gap-6 px-4 py-6 md:flex-row  md:px-6 lg:gap-12  lg:py-8 ',
            )}
            data-cy="admin-panel-container"
          >
            {useHorizontalNav ? (
              <TopBar
                isLoading={isLoading}
                collective={account}
                activeSlug={activeSlug}
                selectedSection={selectedSection}
                expandedSection={expandedSection}
                isAccountantOnly={LoggedInUser?.isAccountantOnly(account)}
                menuItems={menuItems}
              />
            ) : (
              <AdminPanelSideBar
                isLoading={isLoading}
                collective={account}
                activeSlug={activeSlug}
                selectedSection={selectedSection}
                isAccountantOnly={LoggedInUser?.isAccountantOnly(account)}
              />
            )}

            {LoggedInUser && require2FAForAdmins(account) && !LoggedInUser.hasTwoFactorAuth ? (
              <TwoFactorAuthRequiredMessage className="lg:mt-16" />
            ) : (
              <div
                className={clsx(
                  'flex  flex-1 justify-center gap-4 sm:overflow-x-clip',
                  useHorizontalNav ? ' px-4 md:px-8' : '',
                )}
              >
                {useHorizontalNav && subMenu?.length && (
                  <div className="hidden w-48 pt-2 lg:block">
                    <div className="space-y-2 border-l text-sm ">
                      {subMenu.map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={clsx(
                            '-ml-px flex items-center justify-start gap-2 px-4 py-0.5 font-medium transition-colors',
                            selectedSection === item.section
                              ? 'border-l-2 border-primary text-primary'
                              : 'border-l-2 border-transparent text-muted-foreground hover:border-slate-500 ',
                          )}
                        >
                          {item.label}{' '}
                          {item.badge && (
                            <Badge className={'shrink-0'} size={'xs'} round>
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <div className="max-w-[1000px] flex-1">
                  <AdminPanelSection
                    section={selectedSection}
                    isLoading={isLoading}
                    collective={account}
                    subpath={subpath}
                  />
                </div>
                {useHorizontalNav && subMenu?.length && <div className="hidden w-48 xl:block" />}
              </div>
            )}
          </div>
        )}
        <Footer />
      </Page>
    </DashboardContext.Provider>
  );
};

DashboardPage.getInitialProps = () => {
  return {
    scripts: { googleMaps: true }, // TODO: This should be enabled only for events
  };
};

export default DashboardPage;
