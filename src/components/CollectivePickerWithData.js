import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag'
import { DropdownButton, MenuItem, Badge } from 'react-bootstrap';
import Currency from '../components/Currency';
import { FormattedMessage, defineMessages } from 'react-intl';
import ConnectPaypal from '../components/ConnectPaypal';
import AddFundsForm from '../components/AddFundsForm';
import SmallButton from '../components/SmallButton';
import { pick, cloneDeep } from 'lodash';

class CollectivePickerWithData extends React.Component {

  static propTypes = {
    hostCollectiveSlug: PropTypes.string.isRequired,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = {
      connectingPaypal: false,
      loading: false,
      showAddFunds: false
    };
    this.addFunds = this.addFunds.bind(this);
    this.toggleAddFunds = this.toggleAddFunds.bind(this);
    this.onChange = this.onChange.bind(this);
    this.messages = defineMessages({
      'badge.tooltip.pending': { id: 'expenses.badge.tooltip.pending', defaultMessage: "{pending} {pending, plural, one {expense} other {expenses}} pending approval" },
      'badge.tooltip.approved': { id: 'expenses.badge.tooltip.approved', defaultMessage: "{approved} {approved, plural, one {expense} other {expenses}} ready to be paid" }
    });
  }

  async addFunds(form) {
    if (form.totalAmount === 0) {
      return console.error("Total amount must be > 0");
    }
    this.setState({ loading: true });
    const hostCollective = this.hostCollective;
    const order = pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']);
    order.collective = {
      id: this.state.CollectiveId
    };
    if (form.email) {
      order.user = {
        email: form.email,
        name: form.name
      }
    }
    if (form.organization) {
      order.fromCollective = {
        name: form.organization,
        website: form.website
      }
    } else {
      order.fromCollective = {
        id: form.FromCollectiveId || hostCollective.id
      }
    }
    const pm = hostCollective.paymentMethods.find(pm => pm.service === 'opencollective');
    if (!pm) {
      this.setState({ error: "This host doesn't have an opencollective payment method", loading: false });
      return console.error(">>> payment methods: ", hostCollective.paymentMethods);
    }
    order.paymentMethod = {
      uuid: pm.uuid
    }
    console.log(">>> add funds order: ", order);
    try {
      const res = await this.props.createOrder(order)
      this.setState({ showAddFunds: false, loading: false });
    } catch (e) {
      const error = e.message && e.message.replace(/GraphQL error:/, "");
      this.setState({ error, loading: false });
    }
  }

  toggleAddFunds() {
    this.setState({ showAddFunds: !this.state.showAddFunds });
  }

  onChange(CollectiveId) {
    const collectives = this.hostCollective.collectives;
    const selectedCollective = CollectiveId > 0 && collectives.find(c => c.id === CollectiveId);
    this.setState({ CollectiveId });
    this.props.onChange(selectedCollective);
  }

  renderCollectiveMenuItem(collective, className) {
    const { intl } = this.props;
    const badgeCount = collective.stats.expenses.pending + collective.stats.expenses.approved;

    let tooltipArray = [];
    if (collective.stats.expenses.pending > 0) {
      tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.pending'], collective.stats.expenses));
    }
    if (collective.stats.expenses.approved > 0) {
      tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.approved'], collective.stats.expenses));
    }
    const tooltip = tooltipArray.join(', ') || '';

    return (<div className={`MenuItem-Collective ${className}`} title={tooltip}>
      <style jsx>{`
        .MenuItem-Collective {
          display: flex;
          width: 40rem;
          justify-content: space-between;
          align-items: center;
        }

        .MenuItem-Collective.selected {
          float: left;
          margin-right: 1rem;          
        }

        label {
          margin: 0;
        }

        .collectiveName {
          float: left;
          margin-right: 0.2rem;
          max-width: 25rem;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .NameBalance {
          display: flex;
          align-items: baseline;
        }

        .balance {
          margin-left: 0.5rem;
          color: #919599;
          font-size: 1.2rem;
        }

        .balance label {
          font-weight: 300;
        }

        .MenuItem-Collective label {
          margin-right: 0.2rem;
        }
      `}</style>
      <div className="NameBalance">
        <div className="collectiveName">{collective.name}</div>
        <div className="balance">
          <label><FormattedMessage id="expenses.balance.label" defaultMessage="balance:" /></label>
          <Currency value={collective.stats.balance} currency={collective.currency} />
        </div>
      </div>
      { badgeCount > 0 && <Badge pullRight={true}>{badgeCount}</Badge> }
    </div>);
  }

  render() {
    const { LoggedInUser, data: { loading, error, Collective } } = this.props;

    if (error) {
      console.error("graphql error>>>", error.message);
      return (<Error message="GraphQL error" />)
    }

    this.hostCollective = Collective || this.hostCollective;
    const canAddFunds = LoggedInUser && LoggedInUser.canEditCollective(this.hostCollective);

    if (loading || !this.hostCollective) {
      return (<div />);
    }

    const collectives = [...this.hostCollective.collectives].sort((a, b) => {
      return (b.name.toUpperCase() < a.name.toUpperCase()) ? 1 : -1;
    });

    const selectedCollective = collectives.find(c => c.id === this.state.CollectiveId);
    const selectedTitle = selectedCollective ? this.renderCollectiveMenuItem(selectedCollective, 'selected') : <div className="defaultTitle"><FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" /></div>;

    return (
      <div className="CollectivesContainer">
        <style jsx>{`
          .CollectivesContainer {
            background: #f2f4f5;
          }

          .submenu {
            width: 100%;
            min-height: 16rem;
            font-family: Rubik;
            padding: 2rem 2rem 2rem 6rem;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }

          .submenu .title {
            margin: 2rem 0;
            overflow: hidden;
            display: flex;
            align-items: baseline;
          }

          .submenu .title h1 {
            font-family: Rubik;
            font-size: 3.6rem;
            margin: 0 2rem 0 0;
            font-weight: 500;
            color: #18191a;
            float: left;
          }

          .submenu .title h2 {
            font-family: Rubik;
            font-size: 2.4rem;
            margin: 0;
            font-weight: 300;
            color: #18191a;            
          }

          .collectivesFilter {
            display: flex;
          }

          .addFundsLink {
            display: block;
            font-size: 1.2rem;
            padding: 0.8rem;
          }

          .error {
            color: red;
            text-align: center;
            padding-bottom: 3rem;
          }

        `}</style>
        <style global>{`
          .CollectivesContainer .defaultTitle {
            width: 40rem;
            float: left;
            text-align: left;
          }

          .CollectivesContainer .caret {
            float: right;
            margin-top: 7px;
          }

          .right {
            float: right;
            text-align: right;
          }
        `}</style>
         <div className="submenu">
            <div className="">
              <div className="title">
                <h1><FormattedMessage id="expenses.title" defaultMessage="Finances" /></h1>
                <h2><FormattedMessage id="expenses.latest.title" defaultMessage="Latest expenses" /></h2>
              </div>
            { collectives.length > 0 &&
              <div className="collectivesFilter">
                <DropdownButton bsStyle="default" title={selectedTitle} onSelect={this.onChange}>
                  { this.state.CollectiveId &&
                    <MenuItem key={null} eventKey={null}>
                      <FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" />
                    </MenuItem>
                  }
                  { collectives.map(collective => (
                    <MenuItem key={collective.id} eventKey={collective.id} title={collective.name}>
                    { this.renderCollectiveMenuItem(collective) }
                    </MenuItem>
                  ))}
                </DropdownButton>
                { selectedCollective && !this.state.showAddFunds && canAddFunds &&
                  <a className="addFundsLink" onClick={this.toggleAddFunds}><FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" /></a>
                }
              </div>
            }
            </div>
            <div className="right">
              { LoggedInUser && LoggedInUser.canEditCollective(this.hostCollective) &&
                <ConnectPaypal
                  collective={this.hostCollective}
                  />
              }
            </div>
          </div>
          <div>
            { selectedCollective && this.state.showAddFunds &&
              <div>
                <AddFundsForm
                  collective={selectedCollective}
                  host={this.hostCollective}
                  onSubmit={this.addFunds}
                  onCancel={this.toggleAddFunds}
                  loading={this.state.loading}
                  LoggedInUser={LoggedInUser}
                  />
                <div className="results">
                  <div className="error">{this.state.error}</div>
                </div>
              </div>
            }
          </div>
      </div>
    );
  }
}

const getCollectivesQuery = gql`
query Collective($hostCollectiveSlug: String!) {
  Collective(slug: $hostCollectiveSlug) {
    id
    slug
    name
    paymentMethods {
      id
      uuid
      service
      createdAt
      balance
      currency
    }
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
`;

const COLLECTIVES_PER_PAGE = 20;
export const addCollectivesData = graphql(getCollectivesQuery, {
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
        offset: 0,
        limit: props.limit || COLLECTIVES_PER_PAGE * 2,
        includeHostedCollectives: true
      }
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allCollectives.length,
          limit: COLLECTIVES_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allCollectives: [...previousResult.allCollectives, ...fetchMoreResult.allCollectives]
          })
        }
      })
    }
  })  
});


const createOrderQuery = gql`
mutation createOrder($order: OrderInputType!) {
  createOrder(order: $order) {
    id
    collective {
      id
      stats {
        id
        balance
      }
    }
  }
}
`;

const addMutation = graphql(createOrderQuery, {
props: ( { mutate }) => ({
  createOrder: async (order) => {
    return await mutate({ variables: { order } })
  }
})
});

const addGraphQL = compose(addMutation, addCollectivesData);

export default addGraphQL(withIntl(CollectivePickerWithData));