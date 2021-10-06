import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { isHostAccount } from '../lib/collective.lib';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import AdminPanelSection from '../components/admin-panel/AdminPanelSection';
import { ALL_SECTIONS } from '../components/admin-panel/constants';
import AdminPanelSideBar from '../components/admin-panel/SideBar';
import AdminPanelTopBar from '../components/admin-panel/TopBar';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import { Flex, Grid } from '../components/Grid';
import MessageBox from '../components/MessageBox';
import NotificationBar from '../components/NotificationBar';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { useUser } from '../components/UserProvider';

const adminPanelQuery = gqlV2/* GraphQL */ `
  query AdminPanel($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      isHost
      type
      settings
      isArchived
      features {
        ...NavbarFields
        VIRTUAL_CARDS
      }
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      ... on AccountWithHost {
        hostFeePercent
        host {
          id
          slug
          name
          settings
        }
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

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
    defaultMessage: 'This account has been archived is no longer active.',
  },
});

export const getDefaultSectionForAccount = account => {
  return account && isHostAccount(account) ? ALL_SECTIONS.EXPENSES : ALL_SECTIONS.INFO;
};

const getNotification = (intl, account) => {
  if (account?.isArchived) {
    const notification = { status: 'collectiveArchived' };
    if (account.type === 'USER') {
      return {
        ...notification,
        title: intl.formatMessage(messages.userIsArchived),
        description: intl.formatMessage(messages.userIsArchivedDescription),
      };
    } else {
      return {
        ...notification,
        title: intl.formatMessage(messages.collectiveIsArchived, { name: account.name }),
        description: intl.formatMessage(messages.collectiveIsArchivedDescription, {
          type: account.type.toLowerCase(),
        }),
      };
    }
  }
};

const AdminPanelPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const intl = useIntl();
  const { LoggedInUser, loadingLoggedInUser } = useUser();
  const { data, loading } = useQuery(adminPanelQuery, { context: API_V2_CONTEXT, variables: { slug } });

  const account = data?.account;
  const notification = getNotification(intl, account);
  const section = router.query.section || getDefaultSectionForAccount(account);
  const isLoading = loading || loadingLoggedInUser;
  return (
    <Page>
      <AdminPanelTopBar
        isLoading={isLoading}
        collective={data?.account}
        collectiveSlug={slug}
        selectedSection={section}
        display={['flex', null, 'none']}
      />
      {Boolean(notification) && (
        <NotificationBar
          status={notification.status}
          title={notification.title}
          description={notification.description}
        />
      )}
      {account && LoggedInUser && !LoggedInUser?.canEditCollective(account) ? (
        <Flex flexDirection="column" alignItems="center" my={6}>
          <MessageBox type="warning" mb={4} maxWidth={400} withIcon>
            <FormattedMessage defaultMessage="You need to be logged in as an admin" />
          </MessageBox>
          <SignInOrJoinFree form="signin" disableSignup />
        </Flex>
      ) : (
        <Grid
          gridTemplateColumns={['1fr', null, '208px 1fr']}
          maxWidth={1280}
          minHeight={600}
          gridGap={64}
          m="0 auto"
          px={3}
          py={4}
        >
          <AdminPanelSideBar
            isLoading={isLoading}
            collective={account}
            selectedSection={section}
            display={['none', null, 'block']}
          />
          <AdminPanelSection section={section} isLoading={isLoading} collective={account} />
        </Grid>
      )}
      ;
    </Page>
  );
};

export default AdminPanelPage;
