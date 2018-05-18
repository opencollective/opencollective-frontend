import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import { pick } from 'lodash';
import { graphql, compose } from 'react-apollo';
import { FormattedMessage, defineMessages } from 'react-intl';
import {
  Button,
  ButtonGroup,
  DropdownButton,
  MenuItem,
  Badge,
} from 'react-bootstrap';

import withIntl from '../lib/withIntl';
import AddFundsForm from '../components/AddFundsForm';
import Currency from '../components/Currency';
import ConnectPaypal from '../components/ConnectPaypal';
import Error from '../components/Error';


class AddFundsFormContainer extends React.Component {

  addFunds = async form => {
    if (form.totalAmount === 0) {
      return console.error("Total amount must be > 0");
    }
    this.setState({ loading: true });
    const hostCollective = this.hostCollective;
    const order = pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']);
    order.collective = {
      id: this.props.CollectiveId
    };
    if (form.email) {
      order.user = {
        email: form.email,
        name: form.name
      }
    } else if (form.organization) {
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
      await this.props.createOrder(order);
      this.setState({ showAddFunds: false, loading: false });
    } catch (e) {
      const error = e.message && e.message.replace(/GraphQL error:/, "");
      this.setState({ error, loading: false });
    }
  }

  render() {
    return (
      <div>
        <AddFundsForm
          collective={selectedCollective}
          host={this.hostCollective}
          onSubmit={this.addFunds}
          onCancel={this.toggleAddFunds}
          loading={this.state.loading}
          LoggedInUser={this.props.LoggedInUser}
        />
        <div className="results">
          <div className="error">{this.state.error}</div>
        </div>
      </div>
    );
  }
}


class DropDown extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    hostCollectiveSlug: PropTypes.string.isRequired,
    collectiveFilter: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      /* -1 Means that no collective is selected */
      CollectiveId: -1,
      /* Filled in by onChange */
      selectedCollective: null,
      /* Filled in by filterCollectives() */
      hostCollective: null,
    };

    this.messages = defineMessages({
      'badge.tooltip.pending': { id: 'expenses.badge.tooltip.pending', defaultMessage: "{pending} {pending, plural, one {expense} other {expenses}} pending approval" },
      'badge.tooltip.approved': { id: 'expenses.badge.tooltip.approved', defaultMessage: "{approved} {approved, plural, one {expense} other {expenses}} ready to be paid" },
      'collectives': { id: 'expenses.allCollectives', defaultMessage: "All Collectives" },
      'organizations': { id: 'expenses.allOrganizations', defaultMessage: "All Organizations" },
    });
  }

  filterCollectives = () => {
    /* Read both queries from Apollo */
    const { collectiveFilter, data, organizations } = this.props;
    if (!data && !organizations) return { error: 'No data returned by graphql' };
    /* Read data from the query enabled in `collectiveFilter' */
    const { loading, error, Collective } = (data || organizations);
    if (error || loading) return { error, loading };
    /* Unpacking the values is different for collectives and
       organizations */
    switch (collectiveFilter) {
      case 'COLLECTIVES':
        const state = { hostCollective: Collective || this.hostCollective };
        if (state.hostCollective) {
          this.hostCollective = state.hostCollective;
          state.collectives = [...state.hostCollective.collectives];
        }
        return state;
      case 'ORGANIZATIONS':
        return {
          hostCollective: this.props.hostCollective,
          collectives: this.props.organizations.allCollectives,
        };
      default:
        console.error(`Wrong state received by filterCollectives(${collectiveFilter})`);
        break;
    }
  }

  onChange = (CollectiveId) => {
    const { collectives } = this.filterCollectives();
    const selectedCollective = CollectiveId > 0 && collectives.find(c => c.id === CollectiveId);
    this.state.CollectiveId = CollectiveId;
    this.state.selectedCollective = selectedCollective;
    this.props.onChange(selectedCollective);
  }

  renderCollectiveMenuItem = (collective, className) => {
    const { intl } = this.props;
    const tooltipArray = [];
    let badgeCount = 0;

    if (collective.stats.expenses) {
      collective.stats.expenses.pending + collective.stats.expenses.approved;
      if (collective.stats.expenses.pending > 0) {
        tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.pending'], collective.stats.expenses));
      }
      if (collective.stats.expenses.approved > 0) {
        tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.approved'], collective.stats.expenses));
      }
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
    const { intl, collectiveFilter } = this.props;
    const { loading, error, hostCollective, collectives, selectedCollective } = this.filterCollectives();

    if (error) {
      console.error("graphql error>>>", error.message);
      return (<Error message="GraphQL error" />)
    }

    let selectedTitle;

    if (loading) {
      selectedTitle = (
        <div className="defaultTitle">
          <FormattedMessage id="loading" defaultMessage="loading" />
        </div>
      );
    } else if (selectedCollective) {
      selectedTitle = this.renderCollectiveMenuItem(selectedCollective, 'selected')
    } else {
      selectedTitle = (
        <div className="defaultTitle">
          {intl.formatMessage(this.messages[collectiveFilter.toLowerCase()])}
        </div>
      );
    }

    return (
      <div>
        <div className="collectivesFilter">
          <DropdownButton id="collectivePicker" bsStyle="default" title={selectedTitle} onSelect={this.onChange}>
            { this.props.CollectiveId &&
              <MenuItem key={null} eventKey={null}>
                <FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" />
              </MenuItem> }

            { collectives && collectives.map(collective => (
              <MenuItem key={ `collective-${collective.id}` }
                        eventKey={collective.id}
                        title={collective.name}>
                { this.renderCollectiveMenuItem(collective) }
              </MenuItem> )) }

          </DropdownButton>
          { selectedCollective && !this.state.showAddFunds && ::this.canEdit() &&
            <a className="addFundsLink" onClick={this.toggleAddFunds}>
              <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" /></a> }
        </div>
      </div>);
  }
}

class CollectivePickerWithData extends React.Component {

  static propTypes = {
    onChange: PropTypes.func,
    hostCollectiveSlug: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      connectingPaypal: false,
      loading: false,
      showAddFunds: false,
      /* Filter between 'COLLECTIVES' and 'ORGANIZATIONS'. The graphql
       * client uses this to define which query will be loaded in the
       * component */
      collectiveFilter: 'COLLECTIVES',
    };
  }

  canEdit = () => {
    const { LoggedInUser } = this.props;
    return LoggedInUser && LoggedInUser.canEditCollective(this.hostCollective);
  }

  toggleAddFunds() {
    this.setState({ showAddFunds: !this.state.showAddFunds });
  }

  toggleOrgFilter = () => {
    const collectiveFilter = this.state.collectiveFilter === 'COLLECTIVES'
      ? 'ORGANIZATIONS' : 'COLLECTIVES';
    this.setState({ collectiveFilter });
  }

  render() {
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

        .menu {
          text-align:center;
          margin: 1rem 0 3rem 0;
        }

        `}</style>
        <style jsx global>{`
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
          <div>
            <div className="title">
              <h1><FormattedMessage id="expenses.collectivePicker.title" defaultMessage="Finances" /></h1>
              <h2><FormattedMessage id="expenses.collectivePicker.subtitle" defaultMessage="for {n} {n, plural, one {collective} other {collectives}}" values={{n: 1}} /></h2>
            </div>

            <div>
              <label>
                <input type="checkbox" id="showOrganizations"
                       checked={ this.state.collectiveFilter === 'ORGANIZATIONS' }
                       onClick={ () => ::this.toggleOrgFilter() } /> &nbsp; List Organizations
              </label>
            </div>

            <DropDownWithData hostCollectiveSlug={this.props.hostCollectiveSlug}
                              collectiveFilter={this.state.collectiveFilter}
                              onChange={this.props.onChange} />
          </div>
          <div className="right">
            { ::this.canEdit() && <ConnectPaypal collective={this.hostCollective} /> }
          </div>
        </div>
      </div>
    );
  }
}

const getCollectivesQuery = gql`
query Collective($hostCollectiveSlug: String!, $orderBy: CollectiveOrderField, $orderDirection: OrderDirection) {
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
    collectives(orderBy: $orderBy, orderDirection: $orderDirection) {
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
  skip: props => props.collectiveFilter !== 'COLLECTIVES',
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
        offset: 0,
        limit: props.limit || COLLECTIVES_PER_PAGE * 2,
        includeHostedCollectives: true,
        orderBy: 'name',
        orderDirection: 'ASC',
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

/* For listing all the Organizations */
const allCollectivesQuery = gql`
query allCollectives($type: TypeOfCollective, $limit: Int, $offset: Int, $orderBy: CollectiveOrderField, $orderDirection: OrderDirection) {
  allCollectives(type: $type, limit: $limit, offset: $offset, orderBy: $orderBy, orderDirection: $orderDirection) {
    id
    type
    createdAt
    slug
    name
    description
    longDescription
    currency
    stats {
      id
      balance
      yearlyBudget
      backers {
        all
      }
    }
  }
}
`;

const addOrganizations = graphql(allCollectivesQuery, {
  name: 'organizations',
  skip: props => props.collectiveFilter !== 'ORGANIZATIONS',
  options: props => ({
    variables: {
      type: 'ORGANIZATION',
      orderBy: 'name',
      orderDirection: 'ASC',
      offset: 0,
      limit: props.limit || COLLECTIVES_PER_PAGE * 2,
    }
  }),
  props: ({ organizations }) => ({
    organizations,
    fetchMore: () => {
      return organizations.fetchMore({
        variables: {
          offset: organizations.allCollectives.length,
          limit: COLLECTIVES_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;
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
  props: ({ mutate }) => ({
    createOrder: async (order) => {
      return await mutate({ variables: { order } })
    }
  })
});

const queryCollectives = compose(addCollectivesData, addOrganizations);

const DropDownWithData = queryCollectives(withIntl(DropDown));

export default addMutation(withIntl(CollectivePickerWithData));
