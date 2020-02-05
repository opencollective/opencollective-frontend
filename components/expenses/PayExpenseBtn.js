import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import { get } from 'lodash';

import { isValidEmail, getErrorFromGraphqlException } from '../../lib/utils';

import StyledButton from '../StyledButton';
import StyledSpinner from '../StyledSpinner';
import StyledTooltip from '../StyledTooltip';
import { payExpenseMutation } from './graphql/mutations';

class PayExpenseBtn extends React.Component {
  static propTypes = {
    expense: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    host: PropTypes.object,
    disabled: PropTypes.bool,
    paymentProcessorFeeInCollectiveCurrency: PropTypes.number,
    hostFeeInCollectiveCurrency: PropTypes.number,
    platformFeeInCollectiveCurrency: PropTypes.number,
    lock: PropTypes.func,
    unlock: PropTypes.func,
    mutate: PropTypes.func,
    refetch: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onError: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { loading: false };
    this.messages = defineMessages({
      'paypal.missing': {
        id: 'expense.payoutMethod.paypal.missing',
        defaultMessage: 'Please provide a valid paypal email address',
      },
      insufficientBalance: {
        id: 'expense.pay.error.insufficientBalance',
        defaultMessage: 'Insufficient balance',
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
      this.props.onError(error);
      this.setState({ loading: false });
      unlock();
    }
  }

  render() {
    const { collective, expense, intl, host } = this.props;
    const { loading } = this.state;
    let disabled = this.state.loading || this.props.disabled,
      selectedPayoutMethod = expense.payoutMethod,
      disabledMessage;

    if (expense.payoutMethod === 'paypal') {
      if (!isValidEmail(get(expense, 'user.paypalEmail')) && !isValidEmail(get(expense, 'user.email'))) {
        disabled = true;
        disabledMessage = intl.formatMessage(this.messages['paypal.missing']);
      } else {
        const paypalPaymentMethod =
          get(host, 'paymentMethods') && host.paymentMethods.find(pm => pm.service === 'paypal');
        if (get(expense, 'user.paypalEmail') === get(paypalPaymentMethod, 'name')) {
          return null;
        }
      }
    } else if (get(expense, 'PayoutMethod.type') === 'BANK_ACCOUNT') {
      selectedPayoutMethod = 'Transferwise';
    } else if (selectedPayoutMethod === 'other') {
      return null;
    }

    if (get(collective, 'stats.balance') < expense.amount) {
      disabled = true;
      disabledMessage = intl.formatMessage(this.messages.insufficientBalance);
    }

    const button = (
      <StyledButton
        className="pay"
        data-cy="pay-expense-btn"
        buttonStyle="success"
        onClick={() => this.handleOnClickPay()}
        disabled={this.props.disabled || disabled}
        mr={2}
        my={1}
      >
        {loading ? (
          <Fragment>
            <StyledSpinner /> <FormattedMessage id="ProcessingWithDots" defaultMessage="Processing…" />
          </Fragment>
        ) : (
          <FormattedMessage
            id="expense.pay.btn"
            defaultMessage="Pay with {paymentMethod}"
            values={{ paymentMethod: selectedPayoutMethod }}
          />
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
      </React.Fragment>
    );
  }
}

const addMutation = graphql(payExpenseMutation);
export default addMutation(injectIntl(PayExpenseBtn));
