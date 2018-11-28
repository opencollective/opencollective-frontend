import React from 'react';
import PropTypes from 'prop-types';

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';

import ExpensesWithData from '../apps/expenses/components/ExpensesWithData';
import OrdersWithData from '../apps/expenses/components/OrdersWithData';
import ExpensesStatsWithData from '../apps/expenses/components/ExpensesStatsWithData';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ErrorPage from '../components/ErrorPage';
import CollectivePicker from '../components/CollectivePickerWithData';

import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { FormattedMessage } from 'react-intl';

class HostDashboard extends React.Component {
  static propTypes = {
    hostCollectiveSlug: PropTypes.string, // for addData
    LoggedInUser: PropTypes.object,
    data: PropTypes.object, // from addData
  };

  constructor(props) {
    super(props);
    this.state = { selectedCollective: null };
  }

  pickCollective(selectedCollective) {
    this.setState({ selectedCollective });
  }

  render() {
    const { LoggedInUser, data } = this.props;

    if (!data.Collective) return <ErrorPage data={data} />;
    if (!data.Collective.isHost) return <ErrorPage message="collective.is.not.host" />;

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

        <Header
          title={host.name}
          description={host.description}
          twitterHandle={host.twitterHandle}
          image={host.image || host.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            collective={host}
            href={`/${host.slug}`}
            className="small"
            style={get(host, 'settings.style.hero.cover')}
          />

          {LoggedInUser && (
            <CollectivePicker
              host={host}
              LoggedInUser={LoggedInUser}
              onChange={selectedCollective => this.pickCollective(selectedCollective)}
            />
          )}

          <div className="content">
            <div className="columns">
              <div id="expenses" className="first col">
                <div className="header">
                  <h2>
                    <FormattedMessage
                      id="collective.expenses.title"
                      values={{ n: this.totalExpenses }}
                      defaultMessage="{n, plural, one {Latest expense} other {Latest expenses}}"
                    />
                  </h2>
                </div>
                <ExpensesWithData
                  collective={selectedCollective}
                  host={host}
                  includeHostedCollectives={includeHostedCollectives}
                  LoggedInUser={LoggedInUser}
                  filters={true}
                  editable={true}
                />
              </div>
              <div id="orders" className="second col">
                <div className="header">
                  <h2>
                    <FormattedMessage
                      id="collective.orders.title"
                      values={{ n: this.totalOrders }}
                      defaultMessage="{n, plural, one {Latest order} other {Latest orders}}"
                    />
                  </h2>
                </div>
                <OrdersWithData
                  collective={selectedCollective}
                  includeHostedCollectives={includeHostedCollectives}
                  filters={true}
                  LoggedInUser={LoggedInUser}
                />
              </div>
            </div>

            {this.state.selectedCollective && (
              <div className="col side pullLeft">
                <ExpensesStatsWithData slug={selectedCollective.slug} />
              </div>
            )}
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

const getDataQuery = gql`
  query Collective($hostCollectiveSlug: String, $orderBy: CollectiveOrderField, $orderDirection: OrderDirection) {
    Collective(slug: $hostCollectiveSlug) {
      id
      slug
      name
      isHost
      currency
      paymentMethods {
        id
        uuid
        service
        name
        createdAt
        balance
        currency
      }
      collectives(orderBy: $orderBy, orderDirection: $orderDirection) {
        total
        collectives {
          id
          slug
          name
          currency
          hostFeePercent
          stats {
            id
            balance
            expenses {
              id
              all
              pending
              paid
              rejected
              approved
            }
          }
        }
      }
    }
  }
`;

const COLLECTIVES_PER_PAGE = 20;

export const addData = graphql(getDataQuery, {
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
        offset: 0,
        limit: props.limit || COLLECTIVES_PER_PAGE * 2,
        includeHostedCollectives: true,
        orderBy: 'name',
        orderDirection: 'ASC',
      },
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allCollectives.length,
          limit: COLLECTIVES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allCollectives: [...previousResult.allCollectives, ...fetchMoreResult.allCollectives],
          });
        },
      });
    },
  }),
});

export default withIntl(withLoggedInUser(addData(HostDashboard)));
