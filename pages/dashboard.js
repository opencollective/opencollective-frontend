import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { isHostAccount } from '../lib/collective.lib';
import roles from '../lib/constants/roles';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { require2FAForAdmins } from '../lib/policies';

import { ALL_SECTIONS, SECTIONS_ACCESSIBLE_TO_ACCOUNTANTS } from '../components/dashboard/constants';
import { DashboardContext } from '../components/dashboard/DashboardContext';
import AdminPanelSection from '../components/dashboard/DashboardSection';
import { adminPanelQuery } from '../components/dashboard/queries';
import AdminPanelSideBar from '../components/dashboard/SideBar';
import AdminPanelTopBar from '../components/dashboard/TopBar';
import { Box, Flex } from '../components/Grid';
import MessageBox from '../components/MessageBox';
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
    return ALL_SECTIONS.HOME;
  } else if (isHostAccount(account)) {
    return ALL_SECTIONS.HOME;
  } else {
    const isAdmin = loggedInUser?.isAdminOfCollective(account);
    const isAccountant = loggedInUser?.hasRole(roles.ACCOUNTANT, account);
    return !isAdmin && isAccountant ? ALL_SECTIONS.PAYMENT_RECEIPTS : ALL_SECTIONS.HOME;
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

const getIsAccountantOnly = (LoggedInUser, account) => {
  return LoggedInUser && !LoggedInUser.isAdminOfCollective(account) && LoggedInUser.hasRole(roles.ACCOUNTANT, account);
};

const DashboardPage = ({ settings }) => {
  const intl = useIntl();
  const router = useRouter();
  const { slug, section, subpath } = router.query;
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  console.log({ settingsInDashboard: settings });
  // Redirect to the dashboard of the logged in user if no slug is provided
  useEffect(() => {
    if (!slug && LoggedInUser) {
      router.push(`/dashboard/${LoggedInUser.collective.slug}`);
    }
  }, [slug, LoggedInUser]);

  const { data, loading } = useQuery(adminPanelQuery, { context: API_V2_CONTEXT, variables: { slug } });
  const account = data?.account;
  const notification = getNotification(intl, account);
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);
  const [expandedSection, setExpandedSection] = React.useState(null);
  const isLoading = loading || loadingLoggedInUser;
  const blocker = !isLoading && getBlocker(LoggedInUser, account, selectedSection);
  const titleBase = account?.isHost
    ? intl.formatMessage({ id: 'AdminPanel.button', defaultMessage: 'Admin' })
    : intl.formatMessage({ id: 'Settings', defaultMessage: 'Settings' });

  return (
    <DashboardContext.Provider value={{ selectedSection, expandedSection, setExpandedSection, account }}>
      {/* <Page noRobots collective={account} title={account ? `${account.name} - ${titleBase}` : titleBase}> */}
      {!blocker && (
        <AdminPanelTopBar
          isLoading={isLoading}
          collective={data?.account}
          collectiveSlug={slug}
          selectedSection={selectedSection}
          display={['flex', null, 'none']}
        />
      )}
      {Boolean(notification) && <NotificationBar {...notification} />}
      {blocker ? (
        <Flex flexDirection="column" alignItems="center" my={6}>
          <MessageBox type="warning" mb={4} maxWidth={400} withIcon>
            {blocker}
          </MessageBox>
          {!LoggedInUser && <SignInOrJoinFree form="signin" disableSignup />}
        </Flex>
      ) : (
        <div className="relative flex h-full" data-cy="admin-panel-container">
          <AdminPanelSideBar
            isLoading={isLoading}
            collective={account}
            selectedSection={selectedSection}
            display={['none', 'none', 'block']}
            isAccountantOnly={getIsAccountantOnly(LoggedInUser, account)}
            settings={settings}
          />

          <main className="flex-1 page flex justify-start overflow-x-auto">
            {require2FAForAdmins(account) && LoggedInUser && !LoggedInUser.hasTwoFactorAuth ? (
              <TwoFactorAuthRequiredMessage mt={[null, null, '64px']} />
            ) : (
              <div className="w-full max-w-screen-lg">
                <AdminPanelSection
                  section={selectedSection}
                  isLoading={isLoading}
                  collective={account}
                  subpath={subpath}
                  settings={settings}
                />
              </div>
            )}
          </main>
          {/* <div className={'max-w-[280px] shrink-1'}></div> */}
        </div>
      )}
      {/* </Page> */}
    </DashboardContext.Provider>
  );
};

DashboardPage.getInitialProps = () => {
  return {
    scripts: { googleMaps: true }, // TODO: This should be enabled only for events
  };
};

export default DashboardPage;
