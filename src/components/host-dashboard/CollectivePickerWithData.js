import React from 'react';
import PropTypes from 'prop-types';
import { DropdownButton, MenuItem, Badge } from 'react-bootstrap';
import { FormattedMessage, defineMessages } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { pick } from 'lodash';

import withIntl from '../../lib/withIntl';
import Currency from '../Currency';
import ConnectPaypal from '../ConnectPaypal';
import AddFundsForm from '../AddFundsForm';

class CollectivePickerWithData extends React.Component {
  static propTypes = {
    host: PropTypes.object.isRequired,
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      connectingPaypal: false,
      loading: false,
      showAddFunds: false,
    };
    this.addFunds = this.addFunds.bind(this);
    this.toggleAddFunds = this.toggleAddFunds.bind(this);
    this.onChange = this.onChange.bind(this);
    this.canEdit = this.canEdit.bind(this);
    this.messages = defineMessages({
      'badge.tooltip.pending': {
        id: 'expenses.badge.tooltip.pending',
        defaultMessage: '{pending} {pending, plural, one {expense} other {expenses}} pending approval',
      },
      'badge.tooltip.approved': {
        id: 'expenses.badge.tooltip.approved',
        defaultMessage: '{approved} {approved, plural, one {expense} other {expenses}} ready to be paid',
      },
      'addFunds.error.amountMustBeGreatherThanZero': {
        id: 'addFunds.error.amountMustBeGreatherThanZero',
        defaultMessage: 'Total amount must be greater than 0',
      },
      'addFunds.error.missingEmail': {
        id: 'addFunds.error.missingEmail',
        defaultMessage: 'Please provide an email address to identify the source of the money.',
      },
    });
  }

  canEdit = () => {
    const { LoggedInUser } = this.props;
    return LoggedInUser && LoggedInUser.canEditCollective(this.hostCollective);
  };

  async addFunds(form) {
    const { intl } = this.props;

    if (form.totalAmount === 0) {
      const error = intl.formatMessage(this.messages['addFunds.error.amountMustBeGreatherThanZero']);
      this.setState({ error });
      return console.error(error);
    }
    if (form.FromCollectiveId === 'other' && !form.email) {
      const error = intl.formatMessage(this.messages['addFunds.error.missingEmail']);
      this.setState({ error });
      return console.error(error);
    }

    this.setState({ loading: true });
    const hostCollective = this.hostCollective;
    const order = pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']);
    order.collective = {
      id: this.state.CollectiveId,
    };

    if (form.FromCollectiveId === 'other') {
      if (form.email) {
        order.user = {
          email: form.email,
          name: form.name,
        };
      }
      if (form.organization) {
        order.fromCollective = {
          name: form.organization,
          website: form.website,
        };
      }
    } else {
      order.fromCollective = {
        id: form.FromCollectiveId || hostCollective.id,
      };
    }

    const pm = hostCollective.paymentMethods.find(pm => pm.service === 'opencollective');
    if (!pm) {
      this.setState({
        error: "This host doesn't have an opencollective payment method",
        loading: false,
      });
      return console.error('>>> payment methods: ', hostCollective.paymentMethods);
    }
    order.paymentMethod = {
      uuid: pm.uuid,
    };
    try {
      await this.props.addFundsToCollective(order);
      this.setState({ showAddFunds: false, loading: false });
    } catch (e) {
      const error = e.message && e.message.replace(/GraphQL error:/, '');
      this.setState({ error, loading: false });
    }
  }

  toggleAddFunds() {
    this.setState({ showAddFunds: !this.state.showAddFunds });
  }

  onChange(CollectiveId) {
    const collectives = this.hostCollective.collectives.collectives;
    const selectedCollective = CollectiveId > 0 && collectives.find(c => c.id === CollectiveId);
    this.setState({ CollectiveId });
    this.props.onChange(selectedCollective);
  }

  renderCollectiveMenuItem(collective, className) {
    const { intl } = this.props;
    const badgeCount = collective.stats.expenses.pending + collective.stats.expenses.approved;

    const tooltipArray = [];
    if (collective.stats.expenses.pending > 0) {
      tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.pending'], collective.stats.expenses));
    }
    if (collective.stats.expenses.approved > 0) {
      tooltipArray.push(intl.formatMessage(this.messages['badge.tooltip.approved'], collective.stats.expenses));
    }
    const tooltip = tooltipArray.join(', ') || '';

    return (
      <div className={`MenuItem-Collective ${className}`} title={tooltip}>
        <style jsx>
          {`
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
          `}
        </style>
        <div className="NameBalance">
          <div className="collectiveName">{collective.name}</div>
          <div className="balance">
            <label>
              <FormattedMessage id="expenses.balance.label" defaultMessage="balance:" />
            </label>
            <Currency value={collective.stats.balance} currency={collective.currency} />
          </div>
        </div>
        {badgeCount > 0 && <Badge pullRight={true}>{badgeCount}</Badge>}
      </div>
    );
  }

  render() {
    const { host } = this.props;

    this.hostCollective = host;
    if (!this.hostCollective) {
      return <div />;
    }

    const collectives = [...this.hostCollective.collectives.collectives];

    const selectedCollective = collectives.find(c => c.id === this.state.CollectiveId);
    const selectedTitle = selectedCollective ? (
      this.renderCollectiveMenuItem(selectedCollective, 'selected')
    ) : (
      <div className="defaultTitle">
        <FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" />
      </div>
    );

    return (
      <div className="CollectivesContainer">
        <style jsx>
          {`
            .CollectivesContainer {
              background: #f2f4f5;
            }

            .submenu {
              width: 100%;
              min-height: 16rem;
              padding: 3rem 2rem 3rem 6rem;
              display: flex;
              justify-content: space-between;
              align-items: start;
            }

            .submenu .title {
              margin: 2rem 0;
              overflow: hidden;
              display: flex;
              align-items: baseline;
            }

            .submenu .title h1 {
              font-size: 3.6rem;
              margin: 0 2rem 0 0;
              font-weight: 500;
              color: #18191a;
              float: left;
            }

            .submenu .title h2 {
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
          `}
        </style>
        <style jsx global>
          {`
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
          `}
        </style>
        <div className="submenu" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="title">
              <h1>
                <FormattedMessage id="expenses.collectivePicker.title" defaultMessage="Finances" />
              </h1>
              <h2>
                <FormattedMessage
                  id="expenses.collectivePicker.subtitle"
                  defaultMessage="for {n} {n, plural, one {collective} other {collectives}}"
                  values={{ n: collectives.length }}
                />
              </h2>
            </div>
            {collectives.length > 0 && (
              <div className="collectivesFilter">
                <DropdownButton id="collectivePicker" bsStyle="default" title={selectedTitle} onSelect={this.onChange}>
                  {this.state.CollectiveId && (
                    <MenuItem key={null} eventKey={null}>
                      <FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" />
                    </MenuItem>
                  )}
                  {collectives.map(collective => (
                    <MenuItem key={collective.id} eventKey={collective.id} title={collective.name}>
                      {this.renderCollectiveMenuItem(collective)}
                    </MenuItem>
                  ))}
                </DropdownButton>
                {selectedCollective && !this.state.showAddFunds && this.canEdit() && (
                  <a className="addFundsLink" onClick={this.toggleAddFunds}>
                    <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="right" style={{ maxWidth: 450 }}>
            {this.canEdit() && <ConnectPaypal collective={this.hostCollective} />}
          </div>
        </div>
        <div>
          {selectedCollective && this.state.showAddFunds && (
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
          )}
        </div>
      </div>
    );
  }
}

const addFundsToCollectiveQuery = gql`
  mutation addFundsToCollective($order: OrderInputType!) {
    addFundsToCollective(order: $order) {
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

const addMutation = graphql(addFundsToCollectiveQuery, {
  props: ({ mutate }) => ({
    addFundsToCollective: async order => {
      return await mutate({ variables: { order } });
    },
  }),
});

export default addMutation(withIntl(CollectivePickerWithData));
