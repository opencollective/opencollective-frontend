import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get, pick } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';

import AddFundsForm from '../AddFundsForm';
import CollectivePickerAsync from '../CollectivePickerAsync';
import ConnectPaypal from '../ConnectPaypal';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { H2, Span } from '../Text';

const Disclaimer = styled.div`
  display: inline-block;
  margin: 1rem;
  font-size: 1.1rem;
  color: #aaaeb3;
  font-weight: 400;
`;

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
      isActive: PropTypes.boolean,
      paymentMethods: PropTypes.array,
      slug: PropTypes.string.isRequired,
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
      return;
    } else if (!form.FromCollectiveId) {
      const error = intl.formatMessage(this.messages.addFundsMissingFromCollective);
      this.setState({ error });
      return;
    }

    this.setState({ loading: true });

    const order = pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']);
    order.collective = { id: this.state.selectedCollective.id };
    order.fromCollective = { id: Number(form.FromCollectiveId) };

    try {
      await this.props.addFundsToCollective({ variables: { order } });
      this.setState({ showAddFunds: false, loading: false });
    } catch (e) {
      const error = e.message;
      this.setState({ error, loading: false });
    }
  };

  toggleAddFunds = () => {
    this.setState(state => ({ showAddFunds: !state.showAddFunds }));
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

    const hostAddedFundsLimit = get(host, 'plan.addedFundsLimit');
    const hostCanAddFunds = hostAddedFundsLimit === null || get(host, 'plan.addedFunds') < hostAddedFundsLimit;

    const allCollectivesLabel = intl.formatMessage(this.messages.allCollectives);
    const customOptions = selectedCollective ? [{ label: allCollectivesLabel, value: null }] : undefined;
    return (
      <Container background="#f2f4f5" px={2} py={4}>
        <Flex flexWrap="wrap" justifyContent="space-between" maxWidth={1280} m="16px auto">
          <div>
            <div className="title">
              <H2 mb={3}>
                <FormattedMessage id="expenses.collectivePicker.title" defaultMessage="Finances" />{' '}
                <Span fontSize="32px" fontWeight="normal">
                  <FormattedMessage
                    id="expenses.collectivePicker.subtitle"
                    defaultMessage="for {n} {n, plural, one {collective} other {collectives}}"
                    values={{ n: host.stats.collectives.hosted }}
                  />
                </Span>
              </H2>
            </div>
            {(host.stats.collectives.hosted > 0 || host.isActive) && (
              <Box mb={2}>
                <CollectivePickerAsync
                  hostCollectiveIds={[host.id]}
                  types={[
                    CollectiveType.ORGANIZATION,
                    CollectiveType.COLLECTIVE,
                    CollectiveType.EVENT,
                    CollectiveType.FUND,
                    CollectiveType.PROJECT,
                  ]}
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
              <React.Fragment>
                <StyledButton onClick={this.toggleAddFunds} disabled={!hostCanAddFunds}>
                  <FormattedMessage id="addfunds.submit" defaultMessage="Add Funds" />
                </StyledButton>
                {!hostCanAddFunds && (
                  <Disclaimer>
                    <FormattedMessage
                      id="addFunds.error.planLimitReached"
                      defaultMessage="You reached your plan's limit, <a>upgrade your plan</a> to add more funds"
                      values={{
                        a: (...chunks) => <Link route={`/${host.slug}/edit/host-plan`}>{chunks}</Link>,
                      }}
                    />
                    .
                  </Disclaimer>
                )}
              </React.Fragment>
            )}
          </div>
          <Container display="flex" alignItems="center" maxWidth={450}>
            {this.canEdit() && <ConnectPaypal collective={host} onClickRefillBalance={saveFilterPreferences} />}
          </Container>
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

const addFundsToCollectiveMutation = gql`
  mutation AddFundsToCollective($order: OrderInputType!) {
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

const addMutation = graphql(addFundsToCollectiveMutation, {
  name: 'addFundsToCollective',
});

export default addMutation(injectIntl(HostDashboardActionsBanner));
