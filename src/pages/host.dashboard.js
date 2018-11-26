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

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { FormattedMessage } from 'react-intl';

class HostExpensesPage extends React.Component {
  static getInitialProps({ query: { hostCollectiveSlug } }) {
    return { collectiveSlug: hostCollectiveSlug, ssr: false };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string, // for addData
    ssr: PropTypes.bool,
    data: PropTypes.object, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = { selectedCollective: null };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  pickCollective(selectedCollective) {
    this.setState({ selectedCollective });
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (!data.Collective) return <ErrorPage data={data} />;
    if (!data.Collective.isHost)
      return <ErrorPage message="collective.is.not.host" />;

    const collective = data.Collective;
    const selectedCollective = this.state.selectedCollective || collective;
    const includeHostedCollectives = selectedCollective.id === collective.id;

    return (
      <div className="HostExpensesPage">
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
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            collective={collective}
            href={`/${collective.slug}`}
            className="small"
            style={get(collective, 'settings.style.hero.cover')}
          />

          {LoggedInUser && (
            <CollectivePicker
              hostCollectiveSlug={this.props.collectiveSlug}
              LoggedInUser={LoggedInUser}
              onChange={selectedCollective =>
                this.pickCollective(selectedCollective)
              }
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
                  includeHostedCollectives={includeHostedCollectives}
                  LoggedInUser={this.state.LoggedInUser}
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
                  LoggedInUser={this.state.LoggedInUser}
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
  query Collective($collectiveSlug: String) {
    Collective(slug: $collectiveSlug) {
      id
      type
      slug
      name
      currency
      backgroundImage
      settings
      image
      isHost
    }
  }
`;

export const addData = graphql(getDataQuery);

export default withData(withIntl(withLoggedInUser(addData(HostExpensesPage))));
