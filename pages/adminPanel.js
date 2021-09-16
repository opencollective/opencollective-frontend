import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import AdminPanelSection from '../components/admin-panel/AdminPanelSection';
import AdminPanelSideBar from '../components/admin-panel/SideBar';
import AdminPanelTopBar from '../components/admin-panel/TopBar';
import AuthenticatedPage from '../components/AuthenticatedPage';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import { Box, Grid } from '../components/Grid';
import NotificationBar from '../components/NotificationBar';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { useUser } from '../components/UserProvider';

const adminPanelQuery = gqlV2`
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
      }
      virtualCards {
        totalCount
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
  'collective.isArchived': {
    id: 'collective.isArchived',
    defaultMessage: '{name} has been archived.',
  },
  'collective.isArchived.edit.description': {
    id: 'collective.isArchived.edit.description',
    defaultMessage: 'This {type} has been archived and is no longer active.',
  },
  'user.isArchived': {
    id: 'user.isArchived',
    defaultMessage: 'Account has been archived.',
  },
  'user.isArchived.edit.description': {
    id: 'user.isArchived.edit.description',
    defaultMessage: 'This account has been archived is no longer active.',
  },
});
export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'no-cache');

  return {
    props: {},
  };
}

const AdminPanelPage = ({ router }) => {
  const { slug } = router.query;
  const intl = useIntl();
  const { LoggedInUser } = useUser();
  const { data, loading } = useQuery(adminPanelQuery, { context: API_V2_CONTEXT, variables: { slug } });
  const section = router.query.section || 'info';
  const account = data?.account;

  const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(account);
  const notification = {};
  if (account?.isArchived && account?.type === 'USER') {
    notification.title = intl.formatMessage(messages['user.isArchived']);
    notification.description = intl.formatMessage(messages['user.isArchived.edit.description']);
    notification.status = 'collectiveArchived';
  } else if (account?.isArchived) {
    notification.title = intl.formatMessage(messages['collective.isArchived'], {
      name: account.name,
    });
    notification.description = intl.formatMessage(messages['collective.isArchived.edit.description'], {
      type: account.type.toLowerCase(),
    });
    notification.status = 'collectiveArchived';
  }

  return (
    <AuthenticatedPage>
      <AdminPanelTopBar
        isLoading={loading}
        collective={data?.account}
        collectiveSlug={slug}
        selectedSection={section}
        display={['flex', null, 'none']}
      />
      {data?.account?.isArchived && (
        <NotificationBar
          status={notification.status}
          title={notification.title}
          description={notification.description}
        />
      )}
      {!canEditCollective ? (
        <Box className="login" my={6}>
          <p>
            <FormattedMessage
              id="RecurringContributions.permissionError"
              defaultMessage="You need to be logged in as the admin of this account to view this page."
            />
          </p>
          {!LoggedInUser && (
            <Box mt={5}>
              <SignInOrJoinFree />
            </Box>
          )}
        </Box>
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
            isLoading={loading}
            collective={data?.account}
            collectiveSlug={slug}
            selectedSection={section}
            display={['none', null, 'block']}
          />
          <AdminPanelSection section={section} isLoading={loading} collective={data?.account} />
        </Grid>
      )}
      ;
    </AuthenticatedPage>
  );
};

AdminPanelPage.propTypes = {
  router: PropTypes.object,
};

export default withRouter(AdminPanelPage);
