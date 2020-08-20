import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage } from 'react-intl';

import {
  getFromLocalStorage,
  LOCAL_STORAGE_KEYS,
  removeFromLocalStorage,
  setLocalStorage,
} from '../../lib/local-storage';

import ExpensesStatsWithData from '../expenses/ExpensesStatsWithData';
import ExpensesWithData from '../expenses/ExpensesWithData';
import OrdersWithData from '../expenses/OrdersWithData';
import { Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import { H5 } from '../Text';
import { withUser } from '../UserProvider';

import HostDashboardActionsBanner from './HostDashboardActionsBanner';

class HostDashboard extends React.Component {
  static propTypes = {
    hostCollectiveSlug: PropTypes.string, // for addData
    view: PropTypes.oneOf(['expenses', 'expenses-legacy', 'donations']).isRequired,
    LoggedInUser: PropTypes.object,
    data: PropTypes.object, // from addData
  };

  constructor(props) {
    super(props);
    this.state = { selectedCollective: null, expensesFilters: null };
  }

  componentDidMount() {
    this.restoreFilterPreferences();
  }

  pickCollective(selectedCollective) {
    this.setState({ selectedCollective });
  }

  saveFilterPreferences() {
    const { selectedCollective, expensesFilters } = this.state;
    setLocalStorage(
      LOCAL_STORAGE_KEYS.HOST_DASHBOARD_FILTER_PREFERENCES,
      JSON.stringify({
        selectedCollective,
        expensesFilters,
      }),
    );
  }

  restoreFilterPreferences() {
    let filterPreferences = getFromLocalStorage(LOCAL_STORAGE_KEYS.HOST_DASHBOARD_FILTER_PREFERENCES);
    if (filterPreferences) {
      filterPreferences = JSON.parse(filterPreferences);
      this.setState({ ...filterPreferences }, () => {
        removeFromLocalStorage(LOCAL_STORAGE_KEYS.HOST_DASHBOARD_FILTER_PREFERENCES);
      });
    }
  }

  renderExpenses(selectedCollective, includeHostedCollectives) {
    const { LoggedInUser, data } = this.props;
    const host = data.Collective;

    return (
      <Fragment>
        <div id="expenses">
          <div className="header">
            <H5 my={3} textAlign="center">
              <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
            </H5>
          </div>
          <ExpensesWithData
            collective={selectedCollective}
            host={host}
            includeHostedCollectives={includeHostedCollectives}
            LoggedInUser={LoggedInUser}
            hasFilters
            filters={this.state.expensesFilters}
            onFiltersChange={expensesFilters => this.setState({ expensesFilters })}
            editable={true}
          />
        </div>
        {this.state.selectedCollective && (
          <div className="second col pullRight">
            <ExpensesStatsWithData slug={selectedCollective.slug} />
          </div>
        )}
      </Fragment>
    );
  }

  renderDonations(selectedCollective, includeHostedCollectives) {
    const { LoggedInUser } = this.props;
    return (
      <div id="orders" className="col center-block">
        <div className="header">
          <H5 my={3} textAlign="center">
            <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />
          </H5>
        </div>
        <OrdersWithData
          collective={selectedCollective}
          includeHostedCollectives={includeHostedCollectives}
          filters={true}
          LoggedInUser={LoggedInUser}
        />
      </div>
    );
  }

  render() {
    const { LoggedInUser, data, view } = this.props;

    if (data.loading) {
      return (
        <Flex py={5} justifyContent="center">
          <Loading />
        </Flex>
      );
    } else if (!data.Collective) {
      return (
        <MessageBox my={5} type="error" withIcon>
          <FormattedMessage id="notFound" defaultMessage="Not found" />
        </MessageBox>
      );
    }

    const host = data.Collective;
    const selectedCollective = this.state.selectedCollective || host;
    const includeHostedCollectives = selectedCollective.id === host.id;

    return (
      <div className="HostDashboard">
        <style jsx>
          {`
            .col.side {
              width: 100%;
              min-width: 20rem;
              max-width: 25%;
              margin-left: 5rem;
            }

            .col.large {
              margin-left: 6rem;
              min-width: 30rem;
              width: 50%;
              max-width: 75%;
            }
            .columns {
              display: flex;
              max-width: 1080px;
            }
            .col {
              width: 50%;
              max-width: 488px;
              min-width: 300px;
            }
            .col.first {
              margin-right: 104px;
            }
            .col .header {
              display: flex;
              align-items: baseline;
              justify-content: space-between;
            }
            h2 {
              line-height: 24px;
              color: black;
              font-weight: 500;
              font-size: 2rem;
              margin-bottom: 4.8rem;
            }
            @media (max-width: 600px) {
              .columns {
                flex-direction: column-reverse;
              }
              .columns .col {
                max-width: 100%;
              }
            }
          `}
        </style>
        {LoggedInUser && (
          <HostDashboardActionsBanner
            host={host}
            LoggedInUser={LoggedInUser}
            onChange={selectedCollective => this.pickCollective(selectedCollective)}
            defaultSelectedCollective={this.state.selectedCollective}
            saveFilterPreferences={() => this.saveFilterPreferences()}
          />
        )}
        <div className="content">
          {view === 'expenses-legacy' && this.renderExpenses(selectedCollective, includeHostedCollectives)}
          {view === 'donations' && this.renderDonations(selectedCollective, includeHostedCollectives)}
        </div>
      </div>
    );
  }
}

const hostDashboardQuery = gql`
  query HostDashboard($hostCollectiveSlug: String) {
    Collective(slug: $hostCollectiveSlug) {
      id
      slug
      name
      isHost
      isActive
      currency
      paymentMethods(includeHostCollectivePaymentMethod: true) {
        id
        uuid
        service
        name
        createdAt
        expiryDate
        balance
        currency
      }
      stats {
        id
        collectives {
          id
          hosted
        }
      }
      plan {
        addedFunds
        addedFundsLimit
        transferwisePayouts
        transferwisePayoutsLimit
        name
      }
    }
  }
`;

const addHostDashboardData = graphql(hostDashboardQuery, {
  options: props => ({
    variables: {
      hostCollectiveSlug: props.hostCollectiveSlug,
    },
  }),
});

export default withUser(addHostDashboardData(HostDashboard));
