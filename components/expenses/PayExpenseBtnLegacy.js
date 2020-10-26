import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { isValidEmail } from '../../lib/utils';

import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledSpinner from '../StyledSpinner';
import StyledTooltip from '../StyledTooltip';

import { payExpenseMutation } from './graphql/mutations';

class PayExpenseBtnLegacy extends React.Component {
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
    payExpense: PropTypes.func.isRequired,
    refetch: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onError: PropTypes.func,
    onSuccess: PropTypes.func,
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
      paypalSuccessMessage: {
        id: 'expense.pay.paypal.success',
        defaultMessage: 'Expense was paid using PayPal, the money should already be avaialable for the payee.',
      },
      transferwiseSuccessMessage: {
        id: 'expense.pay.transferwise.success',
        defaultMessage:
          "Transfer was created and funded using TransferWise. This expense is be marked as Processing until the money leaves the Host account, after that the money should arrive its destination shortly. If it doesn't, this expense will be updated and marked as Error and you'll be able to try it again.",
      },
      transferwisePlanLimitMessage: {
        id: 'expense.pay.transferwise.planlimit',
        defaultMessage:
          "You reached your plan's limit, <Link>upgrade your plan</Link> to continue paying expense with TransferWise",
      },
    });
  }

  async handleOnClickPay(forceManual = false, successMessage) {
    const { expense, lock, unlock } = this.props;

    lock();
    this.setState({ loading: true });

    try {
      await this.props.payExpense({
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
      if (this.props.onSuccess) {
        this.props.onSuccess(successMessage);
      }
    } catch (e) {
      const error = getErrorFromGraphqlException(e);
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
      disabledMessage,
      successMessage;

    if (expense.payoutMethod === 'paypal') {
      if (
        !get(expense.PayoutMethod, 'data.email') && // New payout methods validate emails on input
        !isValidEmail(get(expense, 'user.paypalEmail')) &&
        !isValidEmail(get(expense, 'user.email'))
      ) {
        disabled = true;
        disabledMessage = intl.formatMessage(this.messages['paypal.missing']);
      } else {
        const paypalPaymentMethod =
          get(host, 'paymentMethods') && host.paymentMethods.find(pm => pm.service === 'paypal');
        if (get(expense, 'user.paypalEmail') === get(paypalPaymentMethod, 'name')) {
          return null;
        }
      }
      successMessage = intl.formatMessage(this.messages['paypalSuccessMessage']);
    } else if (get(expense, 'PayoutMethod.type') === 'BANK_ACCOUNT') {
      selectedPayoutMethod = 'TransferWise';
      successMessage = intl.formatMessage(this.messages['transferwiseSuccessMessage']);
      if (
        host?.plan.transferwisePayoutsLimit !== null &&
        host?.plan.transferwisePayouts >= host?.plan.transferwisePayoutsLimit
      ) {
        disabled = true;
        disabledMessage = intl.formatMessage(this.messages['transferwisePlanLimitMessage'], {
          Link: chunks => <Link route={`/${host.slug}/edit/host-plan`}>{chunks}</Link>,
        });
      }
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
        onClick={() => this.handleOnClickPay(false, successMessage)}
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

const addPayExpenseMutation = graphql(payExpenseMutation, {
  name: 'payExpense',
});

export default injectIntl(addPayExpenseMutation(PayExpenseBtnLegacy));
