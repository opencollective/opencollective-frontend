import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { pick } from 'lodash';
import { Box, Flex } from '@rebass/grid';

import Container from '../Container';
import ConnectPaypal from '../ConnectPaypal';
import AddFundsForm from '../AddFundsForm';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { CollectiveType } from '../../lib/constants/collectives';
import { Span, H2 } from '../Text';
import StyledButton from '../StyledButton';
import MessageBox from '../MessageBox';

/**
 * An action banner for the host dashboard. Currently holds two features:
 *  - A collective picker to filter the list of collectives
 *  - A form to add funds to the selected collective
 *  - A button to connect PayPal
 */
class HostDashboardActionsBanner extends React.Component {
  static propTypes = {
    host: PropTypes.shape({
      id: PropTypes.number,
      paymentMethods: PropTypes.array,
      stats: PropTypes.shape({
        collectives: PropTypes.shape({ hosted: PropTypes.number }).isRequired,
      }).isRequired,
    }).isRequired,
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object,
    saveFilterPreferences: PropTypes.func,
    defaultSelectedCollective: PropTypes.object,
    /** @ignore from apollo */
    addFundsToCollective: PropTypes.func.isRequired,
    /** @ignore from injectIntl */
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      connectingPaypal: false,
      loading: false,
      showAddFunds: false,
      selectedCollective: props.defaultSelectedCollective || null,
    };
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
      addFundsMissingFromCollective: {
        id: 'addFunds.error.missingFromCollective',
        defaultMessage: 'You must specify the source of the funds',
      },
      allCollectives: {
        id: 'expenses.allCollectives',
        defaultMessage: 'All Collectives',
      },
    });
  }

  canEdit = () => {
    const { LoggedInUser, host } = this.props;
    return LoggedInUser && LoggedInUser.canEditCollective(host);
  };

  addFunds = async form => {
    const { intl } = this.props;

    if (form.totalAmount === 0) {
      const error = intl.formatMessage(this.messages['addFunds.error.amountMustBeGreatherThanZero']);
      this.setState({ error });
      return console.error(error);
    } else if (!form.FromCollectiveId) {
      const error = intl.formatMessage(this.messages.addFundsMissingFromCollective);
      this.setState({ error });
      return console.error(error);
    }

    this.setState({ loading: true });
    const hostCollective = this.props.host;
    const order = pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']);
    order.collective = { id: this.state.selectedCollective.id };
    order.fromCollective = { id: Number(form.FromCollectiveId) };

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
  };

  toggleAddFunds = () => {
    this.setState({ showAddFunds: !this.state.showAddFunds });
  };

  onChange = ({ value: collective }) => {
    this.setState({ selectedCollective: collective });
    this.props.onChange(collective);
  };

  getDefaultCollectiveOption = buildOptionFromCollective => {
    return this.state.selectedCollective ? buildOptionFromCollective(this.state.selectedCollective) : undefined;
  };

  render() {
    const { host, intl, saveFilterPreferences } = this.props;
    const { selectedCollective } = this.state;

    if (!host) {
      return null;
    }

    const allCollectivesLabel = intl.formatMessage(this.messages.allCollectives);
    const customOptions = selectedCollective ? [{ label: allCollectivesLabel, value: null }] : undefined;
    return (
      <Container background="#f2f4f5" px={2} py={4}>
        <Flex flexWrap="wrap" justifyContent="space-between" maxWidth={1600} m="16px auto">
          <div>
            <div className="title">
              <H2 mb={3}>
                <FormattedMessage id="expenses.collectivePicker.title" defaultMessage="Finances" />{' '}
                <Span fontSize="H3" fontWeight="normal">
                  <FormattedMessage
                    id="expenses.collectivePicker.subtitle"
                    defaultMessage="for {n} {n, plural, one {collective} other {collectives}}"
                    values={{ n: host.stats.collectives.hosted }}
                  />
                </Span>
              </H2>
            </div>
            {host.stats.collectives.hosted > 0 && (
              <Box mb={2}>
                <CollectivePickerAsync
                  hostCollectiveIds={[host.id]}
                  types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT]}
                  onChange={this.onChange}
                  minWidth={300}
                  width="100%"
                  maxWidth={500}
                  customOptions={customOptions}
                  disabled={this.state.loading}
                  getDefaultOptions={this.getDefaultCollectiveOption}
                  preload
                />
              </Box>
            )}
            {selectedCollective && !this.state.showAddFunds && this.canEdit() && (
              <StyledButton onClick={this.toggleAddFunds}>
                <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" />
              </StyledButton>
            )}
          </div>
          <div style={{ maxWidth: 450 }}>
            {this.canEdit() && <ConnectPaypal collective={host} onClickRefillBalance={saveFilterPreferences} />}
          </div>
        </Flex>
        <div>
          {selectedCollective && this.state.showAddFunds && (
            <div>
              <AddFundsForm
                collective={selectedCollective}
                host={host}
                onSubmit={this.addFunds}
                onCancel={this.toggleAddFunds}
                loading={this.state.loading}
                LoggedInUser={this.props.LoggedInUser}
              />
              {this.state.error && (
                <MessageBox type="error" withIcon maxWidth={700} m="0 auto">
                  {this.state.error.toString()}
                </MessageBox>
              )}
            </div>
          )}
        </div>
      </Container>
    );
  }
}

const addFundsToCollectiveQuery = gql`
  mutation addFundsToCollective($order: OrderInputType!) {
    addFundsToCollective(order: $order) {
      id
      fromCollective {
        id
        slug
        name
      }
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

export default addMutation(injectIntl(HostDashboardActionsBanner));
