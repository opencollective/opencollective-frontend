import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import classNames from 'classnames';
import Scrollchor from 'react-scrollchor';

import { pick, omit } from 'lodash';
import { graphql, compose } from 'react-apollo';
import { FormattedMessage, defineMessages } from 'react-intl';
import {
  Button,
  ButtonGroup,
  Badge,
} from 'react-bootstrap';

import withIntl from '../lib/withIntl';
import AddFundsForm from '../components/AddFundsForm';
import Currency from '../components/Currency';
import ConnectPaypal from '../components/ConnectPaypal';
import Error from '../components/Error';
import ExpensesStatsWithData from '../components/ExpensesStatsWithData';
import { Link } from '../server/pages';


/* Used to limit query and for building pagination links */
const MAX_COLLECTIVES_IN_SIDEBAR = 50;

/* Helper for validating if logged in user can edit a collective */
const canEdit = (props) => {
  const { LoggedInUser, hostCollective } = props;
  return LoggedInUser && LoggedInUser.canEditCollective(hostCollective);
};

/* Class that adds the createOrder mutation to AddFundsForm */
class AddFundsFormContainer extends React.Component {

  static propTypes = {
    hostCollective: PropTypes.object.isRequired,
    selectedCollective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    toggleAddFunds: PropTypes.func.isRequired,
  }

  constructor (props) {
    super(props);
    this.state = { loading: false };
  }

  addFunds = async form => {
    if (form.totalAmount === 0) {
      return console.error("Total amount must be > 0");
    }
    this.setState({ loading: true });
    const { selectedCollective, hostCollective } = this.props;
    const order = pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']);
    order.collective = { id: selectedCollective.id };
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

    if (!hostCollective.paymentMethods) {
      this.setState({ error: "This host doesn't have a payment method", loading: false });
      return console.error(">>> no payment methods: ", hostCollective.paymentMethods);
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
      this.props.toggleAddFunds();
    } catch (e) {
      const error = e.message && e.message.replace(/GraphQL error:/, "");
      this.setState({ error });
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    return (
      <div>
        <AddFundsForm
          collective={this.props.selectedCollective}
          host={this.props.hostCollective}
          onSubmit={this.addFunds}
          onCancel={this.props.toggleAddFunds}
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


class CollectiveSelector extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    hostCollectiveSlug: PropTypes.string.isRequired,
    collectiveFilter: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    toggleAddFunds: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      /* -1 Means that no collective is selected */
      CollectiveId: -1,
      /* Filled in by onChange */
      selectedCollective: null,
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
    const { collectiveFilter, collectives, organizations } = this.props;
    if (!collectives && !organizations) return { error: 'No data returned by graphql' };
    /* Read data from the query enabled in `collectiveFilter' */
    const { loading, error, Collective } = (collectives || organizations);
    if (error || loading) return { error, loading };
    /* Unpacking the values is different for collectives and
       organizations */
    switch (collectiveFilter) {
      case 'COLLECTIVES': {
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
      }
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

  renderSelectedCollective = () => {
    const { name, slug, type } = this.state.selectedCollective;
    return (
      <div style={{ width: '100%' }}>
        <style jsx>{`
        .selectedCollective { margin: -10px -10px 10px; padding: 10px; font-size: 12px; background: #fff; border: 1px solid #f1f3f4; }
        .selectedCollective h1 { font-size: 30px; text-align: left; margin: 0 0 5px 0; color: #000; }
        .selectedCollective h3 { font-size: 16px; }
        .selectedCollective ul { list-style: none; padding: 0; }
        .selectedCollective li { margin: 0; padding: 0 10px; }
        .selectedCollective li label { margin: 0; padding: 0; }
        `}
        </style>
        <div className="selectedCollective" >
          <h1>{ name || slug }</h1>

          { canEdit(this.props) &&
            <a className="addFundsLink" onClick={this.props.toggleAddFunds}>
              <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" />
            </a> }

          { type === 'COLLECTIVE' && <ExpensesStatsWithData slug={slug} /> }
        </div>
      </div>
    );
  }

  renderPagination = (total) => {
    if (total === 0) return <div></div>;
    const limit = MAX_COLLECTIVES_IN_SIDEBAR;
    const offset = this.props.query.collectivesOffset || 0;
    const collectiveQuery = this.props.query.collectivesQuery || null;
    return (
      <ul className="pagination">
        { Array(Math.ceil(total / limit)).fill(1).map((n, i) => (
          <li
            key={`pagination-link-${i * limit}`}
            className={classNames({ active: (i * limit) === offset })}
            >
            <Link
              href={{ query: {
                ...this.props.query,
                collectiveQuery,
                collectivesOffset: i * limit
              }}}
              >
              <a>{`${n + i}`}</a>
            </Link>
          </li>
        )) }
      </ul>
    );
  }

  render() {
    const { intl } = this.props;
    const { loading, error, result } = this.filterCollectives();
    const collectives = result && result.collectives;

    if (error) {
      console.error("graphql error>>>", error.message);
      return (<Error message="GraphQL error" />)
    }

    if (loading) return <div><h1>Loading...</h1><br /><br /></div>;

    return (
      <div>
        <style jsx>{`
        /* Container */
        .collectivesColumn { background: #f1f3f4; padding: 10px; border-top: solid 2px #999 }

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
        `}
        </style>
        <div className="collectivesColumn">

          <div id="selectedCollectiveContainer">
            { this.state.selectedCollective && ::this.renderSelectedCollective() }
          </div>

          <div>
            <h1 className="title">
              <FormattedMessage
                id="expenses.collectivePicker.listCollectivesTitle"
                defaultMessage="{n} {n, plural, one {collective} other {collectives}} listed"
                values={{n: result.total || 0}}
                />
            </h1>

            <ul className="filters">
              <li>
                <label>
                  <input
                    type="radio" name="filterCollectives" readOnly
                    checked={!this.props.query.collectivesQuery}
                    />
                  <Link href={{ query: omit(this.props.query, 'collectivesQuery', 'collectivesOffset') }}>
                    <a>List all</a>
                  </Link>
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="radio" name="filterCollectives" readOnly
                    checked={this.props.query.collectivesQuery === 'approved'}
                    />
                  <Link href={{ query: { ...omit(this.props.query, 'collectivesOffset'), collectivesQuery: 'approved' } }}>
                    <a>With approved expenses</a>
                  </Link>
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="radio" name="filterCollectives" readOnly
                    checked={this.props.query.collectivesQuery === 'pending'}
                    />
                  <Link href={{ query: { ...omit(this.props.query, 'collectivesOffset'), collectivesQuery: 'pending' } }}>
                    <a>With pending expenses</a>
                  </Link>
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
                  <li
                    title={tooltip}
                    key={`collective-${collective.id}`}
                    onClick={() => this.onChange(collective.id)}
                    >
                    <Scrollchor to="collective" animate={{ duration: 200 }} className="nav-link">
                      { badgeCount > 0 && <Badge pullRight={true}>{badgeCount}</Badge> }
                      <div className="NameBalance">
                        <div className="collectiveName">{collective.name || collective.slug}</div>
                        <div className="balance">
                          <label><FormattedMessage id="expenses.balance.label" defaultMessage="balance:" /></label>
                          <Currency value={collective.stats.balance} currency={collective.currency} />
                        </div>
                      </div>
                    </Scrollchor>
                  </li>
                );
            }) }

            { ::this.renderPagination(result.total) }
          </ul>
        </div>
      </div>
    );
  }
}

class CollectivePickerWithData extends React.Component {

  static propTypes = {
    onChange: PropTypes.func,
    toggleAddFunds: PropTypes.func,
    hostCollectiveSlug: PropTypes.string.isRequired,
    hostCollective: PropTypes.object.isRequired,
    query: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      connectingPaypal: false,
      loading: false,
      /* Filter between 'COLLECTIVES' and 'ORGANIZATIONS'. The graphql
       * client uses this to define which query will be loaded in the
       * component */
      collectiveFilter: 'COLLECTIVES',
    };
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
          .CollectivesContainer { padding: 0; }
          .CollectivesContainer .filter { background: #ccc; text-align: center; padding: 10px; }
          .CollectivesContainer .filterBtnGroup { width: 100%; }
          .CollectivesContainer .filterButton { width: auto; }
          .CollectivesContainer .paypalContainer { padding: 10px; }
        `}
        </style>
        <div className="submenu">
          <div className="paypalContainer">
            { canEdit(this.props) && <ConnectPaypal collective={this.props.hostCollective} /> }
          </div>

          <div className="filter">
            <ButtonGroup className="filterBtnGroup">
              <Button
                className="filterButton collectives" bsSize="small"
                bsStyle={this.state.collectiveFilter === 'COLLECTIVES' ? 'primary' : 'default'}
                onClick={() => ::this.toggleOrgFilter()}
                >
                <FormattedMessage id="host.expenses.collectivePicker.collectives" defaultMessage="Collectives" />
              </Button>
              <Button
                className="filterButton organizations" bsSize="small"
                bsStyle={this.state.collectiveFilter === 'ORGANIZATIONS' ? 'primary' : 'default'}
                onClick={() => ::this.toggleOrgFilter()}
                >
                <FormattedMessage id="host.expenses.collectivePicker.organizations" defaultMessage="Organizations" />
              </Button>
            </ButtonGroup>
          </div>

          <CollectiveSelectorWithData
            query={this.props.query}
            hostCollectiveSlug={this.props.hostCollectiveSlug}
            collectiveFilter={this.state.collectiveFilter}
            onChange={this.props.onChange}
            toggleAddFunds={this.props.toggleAddFunds}
            LoggedInUser={this.props.LoggedInUser}
            />
        </div>
      </div>
    );
  }
}

const getCollectivesQuery = gql`
query Collective($hostCollectiveSlug: String!, $orderBy: CollectiveOrderField, $orderDirection: OrderDirection, $limit: Int, $offset: Int, $expenseStatus: String) {
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
    collectives(orderBy: $orderBy, orderDirection: $orderDirection, limit: $limit, offset: $offset, expenseStatus: $expenseStatus) {
      total
      collectives {
        id
        slug
        name
        type
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

export const addCollectivesData = graphql(getCollectivesQuery, {
  name: 'collectives',
  skip: props => props.collectiveFilter !== 'COLLECTIVES',
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
        offset: props.query.collectivesOffset,
        limit: props.query.collectivesLimit || MAX_COLLECTIVES_IN_SIDEBAR,
        expenseStatus: props.query.collectivesQuery,
        includeHostedCollectives: true,
        orderBy: 'slug',
        orderDirection: 'ASC',
      }
    }
  },
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
      orderBy: 'slug',
      orderDirection: 'ASC',
      offset: props.query.collectivesOffset,
      limit: props.query.collectivesLimit || MAX_COLLECTIVES_IN_SIDEBAR,
    }
  }),
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
      return await mutate({ variables: { order } });
    }
  })
});

export const AddFundsFormWithData = addMutation(withIntl(AddFundsFormContainer));

const queryCollectives = compose(addCollectivesData, addOrganizations);

const CollectiveSelectorWithData = queryCollectives(withIntl(CollectiveSelector));

export default withIntl(CollectivePickerWithData);
