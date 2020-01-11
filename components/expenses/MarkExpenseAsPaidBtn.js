import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import { get } from 'lodash';

import { isValidEmail, getErrorFromGraphqlException } from '../../lib/utils';

import StyledButton from '../StyledButton';
import { P } from '../Text';
import StyledTooltip from '../StyledTooltip';
import { payExpenseMutation } from './graphql/mutations';
import StyledSpinner from '../StyledSpinner';

class MarkExpenseAsPaidBtn extends React.Component {
  static propTypes = {
    expense: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
    paymentProcessorFeeInCollectiveCurrency: PropTypes.number,
    hostFeeInCollectiveCurrency: PropTypes.number,
    platformFeeInCollectiveCurrency: PropTypes.number,
    lock: PropTypes.func,
    unlock: PropTypes.func,
    mutate: PropTypes.func,
    refetch: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { loading: false };

    this.messages = defineMessages({
      insufficientBalance: {
        id: 'expense.pay.error.insufficientBalance',
        defaultMessage: 'Insufficient balance',
      },
      paypalMissing: {
        id: 'expense.payoutMethod.paypal.missing',
        defaultMessage: 'Please provide a valid paypal email address',
      },
    });
  }

  async handleOnClickPay(forceManual = false) {
    const { expense, lock, unlock } = this.props;

    lock();
    this.setState({ loading: true });

    try {
      await this.props.mutate({
        variables: {
          id: expense.id,
          paymentProcessorFeeInCollectiveCurrency: this.props.paymentProcessorFeeInCollectiveCurrency,
          hostFeeInCollectiveCurrency: this.props.hostFeeInCollectiveCurrency,
          platformFeeInCollectiveCurrency: this.props.platformFeeInCollectiveCurrency,
          forceManual: forceManual,
        },
      });
      this.setState({ loading: false });
      await this.props.refetch();
      unlock();
    } catch (e) {
      const error = getErrorFromGraphqlException(e).message;
      this.setState({ error, loading: false });
      unlock();
    }
  }

  render() {
    const { collective, expense, intl } = this.props;
    const { loading, error } = this.state;
    let disabled = this.state.loading || this.props.disabled;
    let disabledMessage = '';

    if (expense.payoutMethod === 'paypal') {
      if (!isValidEmail(get(expense, 'user.paypalEmail')) && !isValidEmail(get(expense, 'user.email'))) {
        disabled = true;
        disabledMessage = intl.formatMessage(this.messages.paypalMissing);
      }
    }

    if (get(collective, 'stats.balance') < expense.amount) {
      disabled = true;
      disabledMessage = intl.formatMessage(this.messages.insufficientBalance);
    }

    const button = (
      <StyledButton
        className="pay"
        buttonStyle="success"
        data-cy="mark-expense-as-paid-btn"
        onClick={() => this.handleOnClickPay(expense.payoutMethod === 'paypal')}
        disabled={this.props.disabled || disabled}
        mr={2}
        my={1}
      >
        {loading ? (
          <React.Fragment>
            <StyledSpinner /> <FormattedMessage id="expense.payExpenseBtn.processing" defaultMessage="Processing..." />
          </React.Fragment>
        ) : (
          <FormattedMessage id="expense.pay.manual.btn" defaultMessage="Record as paid" />
        )}
      </StyledButton>
    );

    return (
      <React.Fragment>
        {!disabledMessage ? (
          button
        ) : (
          <StyledTooltip display="grid" content={disabledMessage}>
            {button}
          </StyledTooltip>
        )}
        {error && (
          <P color="red.500" pr={2}>
            {error}
          </P>
        )}
      </React.Fragment>
    );
  }
}

const addMutation = graphql(payExpenseMutation);
export default addMutation(injectIntl(MarkExpenseAsPaidBtn));
