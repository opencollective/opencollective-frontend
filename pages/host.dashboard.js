import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { omit } from 'lodash';

import { Receipt as ReceiptIcon } from '@styled-icons/material/Receipt';
import { Donate as DonateIcon } from '@styled-icons/fa-solid/Donate';
import { CheckDouble } from '@styled-icons/boxicons-regular/CheckDouble';

import styled, { css } from 'styled-components';

import { addCollectiveCoverData } from '../lib/graphql/queries';
import { withUser } from '../components/UserProvider';
import Loading from '../components/Loading';
import Page from '../components/Page';
import CollectiveNavbar from '../components/CollectiveNavbar';
import { FormattedMessage } from 'react-intl';
import MessageBox from '../components/MessageBox';
import Container from '../components/Container';
import Link from '../components/Link';
import { Dashboard, PendingApplications } from '../components/host-dashboard';

const MenuLink = styled(props => <Link {...omit(props, ['isActive'])} />)`
  padding: 4px 20px 0 20px;
  color: #71757a;
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 4px solid rgb(0, 0, 0, 0);

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
    view: PropTypes.oneOf(['expenses', 'donations', 'pending-applications']).isRequired,
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
    } else if (LoggedInUser && !LoggedInUser.canEditCollective(data.Collective)) {
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

    if (view === 'pending-applications') {
      return <PendingApplications hostCollectiveSlug={host.slug} />;
    } else {
      return <Dashboard view={view} hostCollectiveSlug={host.slug} LoggedInUser={LoggedInUser} />;
    }
  }

  render() {
    const { LoggedInUser, loadingLoggedInUser, data, view, slug } = this.props;
    const host = data.Collective || {};

    const canEdit = LoggedInUser && host && LoggedInUser.canEditCollective(host);

    return (
      <Page collective={host} title={host.name || 'Host Dashboard'} LoggedInUser={LoggedInUser}>
        {data.Collective && (
          <Container mb={4}>
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
              boxShadow="0px 6px 10px 1px #E6E8EB"
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
                <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />
              </MenuLink>
              <MenuLink
                route="host.dashboard"
                params={{ hostCollectiveSlug: slug, view: 'pending-applications' }}
                isActive={view === 'pending-applications'}
              >
                <CheckDouble size="1.2em" />
                <FormattedMessage id="host.dashboard.tab.pendingApplications" defaultMessage="Pending applications" />
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
