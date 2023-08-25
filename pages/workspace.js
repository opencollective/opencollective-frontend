import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { isHostAccount } from '../lib/collective.lib';
import roles from '../lib/constants/roles';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { require2FAForAdmins } from '../lib/policies';

import { Box, Flex } from '../components/Grid';
import MessageBox from '../components/MessageBox';
import NotificationBar from '../components/NotificationBar';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { TwoFactorAuthRequiredMessage } from '../components/TwoFactorAuthRequiredMessage';
import { ALL_SECTIONS, SECTIONS_ACCESSIBLE_TO_ACCOUNTANTS } from '../components/workspace/constants';
import { DashboardContext } from '../components/workspace/DashboardContext';
import AdminPanelSection from '../components/workspace/DashboardSection';
import Footer from '../components/workspace/Footer';
import { adminPanelQuery } from '../components/workspace/queries';
import AdminPanelSideBar from '../components/workspace/SideBar';

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
    return ALL_SECTIONS.INFO;
  } else if (account?.type === 'INDIVIDUAL') {
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

const DashboardPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const { slug, section, subpath } = router.query;
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const activeSlug = slug;

  const { data, loading } = useQuery(adminPanelQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: activeSlug },
    skip: !activeSlug,
  });

  const account = data?.account;
  const notification = getNotification(intl, account);
  const selectedSection = section || getDefaultSectionForAccount(account, LoggedInUser);
  const [expandedSection, setExpandedSection] = React.useState(null);
  const isLoading = loading || loadingLoggedInUser;
  const blocker = !isLoading && getBlocker(LoggedInUser, account, selectedSection);
  const titleBase = intl.formatMessage({ id: 'Dashboard', defaultMessage: 'Dashboard' });

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
          <Flex flexDirection="column" alignItems="center" my={6}>
            <MessageBox type="warning" mb={4} maxWidth={400} withIcon>
              {blocker}
            </MessageBox>
            {!LoggedInUser && <SignInOrJoinFree form="signin" disableSignup />}
          </Flex>
        ) : (
          <Flex
            flexDirection={['column', 'column', 'row']}
            justifyContent={'center'}
            minHeight={600}
            gridGap={[24, null, 48]}
            data-cy="admin-panel-container"
            py={['24px', null, '32px']}
            px={['16px', '24px']}
          >
            <AdminPanelSideBar
              isLoading={isLoading}
              collective={account}
              activeSlug={activeSlug}
              selectedSection={selectedSection}
              isAccountantOnly={LoggedInUser?.isAccountantOnly(account)}
            />
            {require2FAForAdmins(account) && LoggedInUser && !LoggedInUser.hasTwoFactorAuth ? (
              <TwoFactorAuthRequiredMessage mt={[null, null, '64px']} />
            ) : (
              <Box flex="0 1 1000px">
                <AdminPanelSection
                  section={selectedSection}
                  isLoading={isLoading}
                  collective={account}
                  subpath={subpath}
                />
              </Box>
            )}
          </Flex>
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
