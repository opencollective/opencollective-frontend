import React from 'react';
import PropTypes from 'prop-types';
import { CheckDouble } from '@styled-icons/boxicons-regular/CheckDouble';
import { Donate as DonateIcon } from '@styled-icons/fa-solid/Donate';
import { Grid as HostedCollectivesIcon } from '@styled-icons/feather/Grid';
import { Receipt as ReceiptIcon } from '@styled-icons/material/Receipt';
import { omit } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { ORDER_STATUS } from '../lib/constants/order-status';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import CollectiveNavbar from '../components/CollectiveNavbar';
import Container from '../components/Container';
import { Box, Flex } from '../components/Grid';
import { HOST_SECTIONS } from '../components/host-dashboard/constants';
import HostDashboardExpenses from '../components/host-dashboard/HostDashboardExpenses';
import HostDashboardHostedCollectives from '../components/host-dashboard/HostDashboardHostedCollectives';
import PendingApplications from '../components/host-dashboard/PendingApplications';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import OrdersWithData from '../components/orders/OrdersWithData';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const MenuLink = styled(props => <Link {...omit(props, ['isActive'])} />)`
  padding: 4px 20px 0 20px;
  color: #71757a;
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 4px solid rgb(0, 0, 0, 0);

  @media (max-width: 600px) {
    width: 100%;
    justify-content: center;
  }

  &:focus {
    color: #090a0a;
  }

  &:hover {
    color: #404040;
  }

  svg {
    margin-right: 1em;
  }

  ${props =>
    props.isActive &&
    css`
      color: #090a0a;
      border-bottom: 4px solid #090a0a;
      font-weight: 600;
    `}
`;

class HostDashboardPage extends React.Component {
  static getInitialProps({ query: { hostCollectiveSlug, view } }) {
    return { slug: hostCollectiveSlug, ssr: false, view: view || 'expenses' };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    ssr: PropTypes.bool,
    data: PropTypes.object, // from withData
    loadingLoggedInUser: PropTypes.bool.isRequired, // from withUser
    LoggedInUser: PropTypes.object, // from withUser
    view: PropTypes.oneOf(['expenses', 'hosted-collectives', 'donations', 'pending-applications']).isRequired,
  };

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (this.props.data.Collective && (!newProps.data || !newProps.data.Collective)) {
      return false;
    } else {
      return true;
    }
  }

  renderView(host) {
    const { view, LoggedInUser, data } = this.props;

    if (!LoggedInUser) {
      return (
        <MessageBox m={5} type="error" withIcon>
          <FormattedMessage id="mustBeLoggedIn" defaultMessage="You must be logged in to see this page" />
        </MessageBox>
      );
    } else if (!LoggedInUser.canEditCollective(data.Collective)) {
      return (
        <MessageBox m={5} type="error" withIcon>
          <FormattedMessage
            id="mustBeAdmin"
            defaultMessage="You must be an admin of this collective to see this page"
          />
        </MessageBox>
      );
    } else if (!data.Collective) {
      return (
        <MessageBox m={5} type="error" withIcon>
          <FormattedMessage id="notFound" defaultMessage="Not found" />
        </MessageBox>
      );
    } else if (!data.Collective.plan.hostDashboard) {
      return (
        <MessageBox m={5} type="error" withIcon>
          <FormattedMessage
            id="page.error.plan.needs.upgrade"
            defaultMessage="You must upgrade your plan to access this page"
          />
        </MessageBox>
      );
    } else if (!host.isHost) {
      return (
        <MessageBox m={5} type="error" withIcon>
          <FormattedMessage id="page.error.collective.is.not.host" defaultMessage="This page is only for hosts" />
        </MessageBox>
      );
    }

    switch (view) {
      case 'pending-applications':
        return <PendingApplications hostSlug={host.slug} />;
      case 'donations':
        return (
          <Box py={4}>
            <OrdersWithData
              accountSlug={host.slug}
              status={ORDER_STATUS.PENDING}
              title={<FormattedMessage id="PendingBankTransfers" defaultMessage="Pending bank transfers" />}
            />
          </Box>
        );
      case HOST_SECTIONS.HOSTED_COLLECTIVES:
        return <HostDashboardHostedCollectives hostSlug={host.slug} />;
      default:
        return <HostDashboardExpenses hostSlug={host.slug} />;
    }
  }

  render() {
    const { LoggedInUser, loadingLoggedInUser, data, view, slug } = this.props;
    const host = data.Collective || {};

    const canEdit = LoggedInUser && host && LoggedInUser.canEditCollective(host);

    return (
      <Page collective={host} title={host.name || 'Host Dashboard'} withoutGlobalStyles={!['donations'].includes(view)}>
        {data.Collective && (
          <Container>
            <CollectiveNavbar collective={host} isAdmin={canEdit} showEdit onlyInfos={true} />
          </Container>
        )}
        {loadingLoggedInUser || data.loading ? (
          <Flex px={2} py={5} justifyContent="center">
            <Loading />
          </Flex>
        ) : (
          <React.Fragment>
            <Container
              position="relative"
              display="flex"
              justifyContent="center"
              alignItems="center"
              background="white"
              borderBottom="#E6E8EB"
              boxShadow="0px 7px 10px 3px #E6E8EB"
              minHeight={60}
              flexWrap="wrap"
              data-cy="host-dashboard-menu-bar"
            >
              <MenuLink
                route="host.dashboard"
                params={{ hostCollectiveSlug: slug, view: 'expenses' }}
                isActive={view === 'expenses'}
              >
                <ReceiptIcon size="1em" />
                <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
              </MenuLink>
              <MenuLink
                route="host.dashboard"
                params={{ hostCollectiveSlug: slug, view: 'donations' }}
                isActive={view === 'donations'}
              >
                <DonateIcon size="1em" />
                <FormattedMessage id="PendingBankTransfers" defaultMessage="Pending bank transfers" />
              </MenuLink>
              <MenuLink
                route="host.dashboard"
                params={{ hostCollectiveSlug: slug, view: 'pending-applications' }}
                isActive={view === 'pending-applications'}
              >
                <CheckDouble size="1.2em" />
                <FormattedMessage id="host.dashboard.tab.pendingApplications" defaultMessage="Pending applications" />
              </MenuLink>
              <MenuLink
                route="host.dashboard"
                params={{ hostCollectiveSlug: slug, view: HOST_SECTIONS.HOSTED_COLLECTIVES }}
                isActive={view === HOST_SECTIONS.HOSTED_COLLECTIVES}
              >
                <HostedCollectivesIcon size="1.2em" />
                <FormattedMessage id="HostedCollectives" defaultMessage="Hosted Collectives" />
              </MenuLink>
            </Container>
            <div>{this.renderView(host)}</div>
          </React.Fragment>
        )}
      </Page>
    );
  }
}

export default withUser(addCollectiveCoverData(HostDashboardPage));
