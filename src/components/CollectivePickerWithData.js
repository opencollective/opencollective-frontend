import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import Scrollchor from 'react-scrollchor';

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
import ExpensesStatsWithData from '../components/ExpensesStatsWithData';


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
    LoggedInUser: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      /* -1 Means that no collective is selected */
      CollectiveId: -1,
      /* Filled in by onChange */
      selectedCollective: null,
      /* We don't show it up until the user selects a collective */
      showAddFundsForm: false,
    };

    /* Filled in by filterCollectives(). It's not in state because it
       reads information that was processed by Apollo so we may access
       that in a render method. That doesn't feel quite right, but it
       might take another round of refactoring to be changed. */
    this.hostCollective = null;

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
        /* Other placess need this this value and since this function
           can be called from render(), the value is being shovelled
           within an instance slot instead of the state.

           It's only safe to do this here because `collectiveFilter'
           defaults to 'COLLECTIVES' so we know that this happens
           before anything else depending on `this.hostCollective`. */
        this.hostCollective = Collective;
        const state = { hostCollective: Collective };
        if (state.hostCollective) {
          state.result = state.hostCollective.collectives;
        }
        return state;
      case 'ORGANIZATIONS':
        return {
          hostCollective: this.hostCollective,
          result: organizations.allCollectives.collectives,
        };
      default:
        console.error(`Wrong state received by filterCollectives(${collectiveFilter})`);
        break;
    }
  }

  onChange = (CollectiveId) => {
    const { result } = this.filterCollectives();
    if (CollectiveId > 0) {
      const selectedCollective = result.collectives.find(c => c.id === CollectiveId);
      this.setState({ CollectiveId, selectedCollective });
      this.props.onChange(selectedCollective);
    }
  }

  canEdit = () => {
    const user = this.props.LoggedInUser;
    /* console.log('CANEDIT', user, this.hostCollective);*/
    return user && user.canEditCollective(this.hostCollective);
  }

  renderSelectedCollective = () => {
    const { name, slug, image, backgroundImage, stats: { expenses } } =
      this.state.selectedCollective;
    return (
      <div style={{ width: '100%' }}>
        <style jsx>{`
        .selectedCollective { margin: -10px -10px 10px; padding: 10px; font-size: 12px; background: #fff; border: 1px solid #f1f3f4; }
        .selectedCollective h1 { font-size: 30px; text-align: left; margin: 0 0 5px 0; color: #000; }
        .selectedCollective h3 { font-size: 16px; }
        .selectedCollective ul { list-style: none; padding: 0; }
        .selectedCollective li { margin: 0; padding: 0 10px; }
        .selectedCollective li label { margin: 0; padding: 0; }
        `}</style>
        <div className="selectedCollective" >
          <h1>{ name || slug }</h1>

          { !this.state.showAddFundsForm && ::this.canEdit() &&
            <a className="addFundsLink" onClick={this.toggleAddFunds}>
              <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" /></a> }

          <ExpensesStatsWithData slug={slug} />
        </div>
      </div>
    );
  }

  render() {
    const { intl, collectiveFilter } = this.props;
    const { loading, error, hostCollective, result } = this.filterCollectives();
    const collectives = result && result.collectives;

    if (error) {
      console.error("graphql error>>>", error.message);
      return (<Error message="GraphQL error" />)
    }

    if (loading) return <div><h1>Loading...</h1><br/><br/></div>;

    return (
      <div>
        <style jsx>{`
        /* Container */
        .collectivesColumn { background: #f1f3f4; padding: 10px; }

        /* Title */
        .collectivesColumn h1 { margin: 0 0 20px 0; text-align: left; }

        /* Filters */
        .collectivesColumn ul.filters { list-style: none; margin: -5px 0 0 0; padding: 0; }
        .collectivesColumn ul.filters li { margin: 0; padding-left: 10px; }
        .collectivesColumn ul.filters li label { margin: 0; font-weight: normal; }
        .collectivesColumn ul.filters li input { margin-right: 4px; }

        /* List of collective */
        .collectivesColumn ul.colectives { list-style: none; margin: 0; padding: 0; }
        .collectivesColumn ul.colectives li { border-bottom: 1px solid #46b0ed; background: #fff; padding: 4px 10px 0 10px; }
        .collectivesColumn ul.colectives li a:link { color: #333; }
        .collectivesColumn .balance { font-size: 12px; color: gray; }
        .collectivesColumn .balance label { margin-right: 4px; }
        `}</style>
        <div className="collectivesColumn">

          <div id="selectedCollectiveContainer">
            { this.state.selectedCollective && ::this.renderSelectedCollective() }
          </div>

          <div>
            <h1 className="title">
              <FormattedMessage
                id="expenses.collectivePicker.listCollectivesTitle"
                defaultMessage="You host {n} {n, plural, one {collective} other {collectives}}"
                values={{n: result.total || 0}} />
            </h1>

            <ul className="filters">
              <li>
                <label>
                  <input type="radio" name="filterCollectives" />
                  List all
                </label>
              </li>
              <li>
                <label>
                  <input type="radio" name="filterCollectives" />
                  With pending expenses
                </label>
              </li>
            </ul>
          </div>

          <ul className="colectives">
            { collectives.map(collective => {
                const tooltipArray = [];
                let badgeCount = 0;

                if (collective.stats.expenses) {
                  const { pending, approved } = collective.stats.expenses;
                  badgeCount = pending + approved;
                  if (pending > 0) {
                    tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.pending'], collective.stats.expenses));
                  }
                  if (approved > 0) {
                    tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.approved'], collective.stats.expenses));
                  }
                }
                const tooltip = tooltipArray.join(', ') || '';

                return (
                  <li key={ `collective-${collective.id}` } onClick={(e) => this.onChange (collective.id)}>
                    <Scrollchor to="collective" animate={{ duration: 200 }} className="nav-link">
                      { badgeCount > 0 && <Badge pullRight={true}>{badgeCount}</Badge> }
                      <div className="NameBalance">
                        <div className="collectiveName">{ collective.name || collective.slug }</div>
                        <div className="balance">
                          <label><FormattedMessage id="expenses.balance.label" defaultMessage="balance:" /></label>
                          <Currency value={collective.stats.balance} currency={collective.currency} />
                        </div>
                      </div>
                    </Scrollchor>
                  </li>
                );
            }) }


            {/* <DropdownButton id="collectivePicker" bsStyle="default" title={selectedTitle} onSelect={this.onChange}> */}
            {/* { this.props.CollectiveId &&
                <MenuItem key={null} eventKey={null}>
                <FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" />
                </MenuItem> }

                { collectives && collectives.map(collective => (
                <MenuItem key={ `collective-${collective.id}` }
                eventKey={collective.id}
                title={collective.name}>
                { this.renderCollectiveMenuItem(collective) }
                </MenuItem> )) } */}
            {/* </DropdownButton> */}

          </ul>
        </div>
      </div>);
  }
}

class CollectivePickerWithData extends React.Component {

  static propTypes = {
    onChange: PropTypes.func,
    hostCollectiveSlug: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    console.log('query', props.query);
    this.state = {
      connectingPaypal: false,
      loading: false,
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
      <div id="collective" className="CollectivesContainer">
        <style jsx>{`
          .CollectivesContainer { background: #ccc; padding: 0; }
          .CollectivesContainer .filter { text-align: center; padding: 10px; }
          .CollectivesContainer .filterBtnGroup { width: 100%; }
          .CollectivesContainer .filterButton { width: auto; }
        `}</style>
        <div className="submenu">
          <div>
            <div className="filter">
              <ButtonGroup className="filterBtnGroup">
                <Button className="filterButton collectives" bsSize="small"
                        bsStyle={ this.state.collectiveFilter === 'COLLECTIVES' ? 'primary' : 'default'}
                        onClick={ () => ::this.toggleOrgFilter() } >
                  <FormattedMessage id="host.expenses.collectivePicker.collectives" defaultMessage="Collectives" />
                </Button>
                <Button className="filterButton organizations" bsSize="small"
                        bsStyle={ this.state.collectiveFilter === 'ORGANIZATIONS' ? 'primary' : 'default'}
                        onClick={ () => ::this.toggleOrgFilter() } >
                  <FormattedMessage id="host.expenses.collectivePicker.organizations" defaultMessage="Organizations" />
                </Button>
              </ButtonGroup>
            </div>

            <DropDownWithData hostCollectiveSlug={this.props.hostCollectiveSlug}
                              collectiveFilter={this.state.collectiveFilter}
                              onChange={this.props.onChange}
                              LoggedInUser={this.props.LoggedInUser} />
          </div>
          {/* <div className="right">
              { ::this.canEdit() && <ConnectPaypal collective={this.hostCollective} /> }
              </div> */}
        </div>
      </div>
    );
  }
}

const getCollectivesQuery = gql`
query Collective($hostCollectiveSlug: String!, $orderBy: CollectiveOrderField, $orderDirection: OrderDirection, $limit: Int, $offset: Int) {
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
    collectives(orderBy: $orderBy, orderDirection: $orderDirection, limit: $limit, offset: $offset) {
      total
      collectives {
        id
        slug
        name
        image
        backgroundImage
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

export const addCollectivesData = graphql(getCollectivesQuery, {
  skip: props => props.collectiveFilter !== 'COLLECTIVES',
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
        offset: 0,
        limit: props.limit || COLLECTIVES_PER_PAGE,
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
            /* allCollectives: [...previousResult.allCollectives, ...fetchMoreResult.allCollectives]*/
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
    image
    backgroundImage
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
            /* allCollectives: [...previousResult.allCollectives, ...fetchMoreResult.allCollectives]*/
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
