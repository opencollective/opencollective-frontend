import React from 'react';
import PropTypes from 'prop-types';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { University as OtherIcon } from '@styled-icons/fa-solid/University';
import { get, includes } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';
import { getAmountInCents } from '../../lib/currency-utils';

import TransferwiseIcon from '../icons/TransferwiseIcon';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';

import PayExpenseModal from './PayExpenseModal';
import SecurityChecksModal, { expenseRequiresSecurityConfirmation } from './SecurityChecksModal';

const getDisabledMessage = (expense, collective, host, payoutMethod) => {
  // Collective / Balance can be v1 or v2 there ...
  const expenseAmountInAccountCurrency = getAmountInCents(expense.amountInAccountCurrency);
  const balance = get(
    collective,
    'stats.balanceWithBlockedFunds.valueInCents',
    get(collective, 'stats.balanceWithBlockedFunds', 0),
  );
  if (!host) {
    return (
      <FormattedMessage id="expense.pay.error.noHost" defaultMessage="Expenses cannot be paid without a Fiscal Host" />
    );
  } else if (balance < expenseAmountInAccountCurrency) {
    return <FormattedMessage id="expense.pay.error.insufficientBalance" defaultMessage="Insufficient balance" />;
  } else if (includes(expense.requiredLegalDocuments, 'US_TAX_FORM')) {
    return (
      <FormattedMessage
        id="TaxForm.DisabledPayment"
        defaultMessage="Unable to pay because tax form has not been submitted."
      />
    );
  } else if (!payoutMethod) {
    return null;
  } else if (payoutMethod.type === PayoutMethodType.BANK_ACCOUNT) {
    return null;
  } else if (payoutMethod.type === PayoutMethodType.ACCOUNT_BALANCE) {
    if (!expense.payee.host) {
      return (
        <FormattedMessage
          id="expense.pay.error.payee.noHost"
          defaultMessage="Unable to pay because payee Collective does not have a Fiscal Host."
        />
      );
    }
    if (expense.payee.host.id !== host.id) {
      return (
        <FormattedMessage
          id="expense.pay.error.payee.sameHost"
          defaultMessage="Payer and payee must have the same Fiscal Host to pay this way."
        />
      );
    }
  }
};

const PayoutMethodTypeIcon = ({ type, host, ...props }) => {
  if (type === PayoutMethodType.PAYPAL) {
    return <PaypalIcon {...props} />;
  } else if (type === PayoutMethodType.BANK_ACCOUNT && host?.transferwise) {
    return <TransferwiseIcon {...props} />;
  } else {
    return <OtherIcon {...props} />;
  }
};

PayoutMethodTypeIcon.propTypes = {
  type: PropTypes.oneOf(Object.values(PayoutMethodType)),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  host: PropTypes.shape({
    transferwise: PropTypes.object,
  }),
};

const PayExpenseButton = ({ expense, collective, host, disabled, onSubmit, error, ...props }) => {
  const [hasModal, showModal] = React.useState(false);
  const [hasSecurityModal, showSecurityModal] = React.useState(false);
  const disabledMessage = getDisabledMessage(expense, collective, host, expense.payoutMethod);
  const isDisabled = Boolean(disabled || disabledMessage);
  const requiresSecurityCheck = expenseRequiresSecurityConfirmation(expense);

  const handleClick = () => (requiresSecurityCheck ? showSecurityModal(true) : showModal(true));

  const button = (
    <StyledButton
      buttonStyle="successSecondary"
      data-cy="pay-button"
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
    >
      <PayoutMethodTypeIcon type={expense.payoutMethod?.type} host={host} size={12} />
      <Span ml="6px">
        <FormattedMessage id="actions.goToPay" defaultMessage="Go to Pay" />
      </Span>
    </StyledButton>
  );

  if (disabledMessage) {
    return <StyledTooltip content={disabledMessage}>{button}</StyledTooltip>;
  } else if (hasModal) {
    return (
      <React.Fragment>
        {button}
        <PayExpenseModal
          expense={expense}
          collective={collective}
          host={host}
          onClose={() => showModal(false)}
          error={error}
          onSubmit={async values => {
            const { action, ...data } = values;
            const success = await onSubmit(action, data);
            if (success) {
              showModal(false);
            }
          }}
        />
      </React.Fragment>
    );
  } else if (hasSecurityModal) {
    return (
      <React.Fragment>
        {button}
        <SecurityChecksModal
          expense={expense}
          onConfirm={() => {
            showModal(true);
            showSecurityModal(false);
          }}
          onClose={() => showSecurityModal(false)}
        />
      </React.Fragment>
    );
  } else {
    return button;
  }
};

PayExpenseButton.propTypes = {
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    amount: PropTypes.number,
    payoutMethod: PropTypes.shape({
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
    }),
    payee: PropTypes.shape({
      host: PropTypes.shape({
        id: PropTypes.string,
      }),
    }),
  }).isRequired,
  collective: PropTypes.shape({
    host: PropTypes.shape({
      plan: PropTypes.object,
    }),
    stats: PropTypes.shape({
      // Collective / Balance can be v1 or v2 there ...
      balanceWithBlockedFunds: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.shape({
          valueInCents: PropTypes.number.isRequired,
          currency: PropTypes.string.isRequired,
        }),
      ]),
    }),
  }).isRequired,
  host: PropTypes.shape({
    id: PropTypes.string,
    plan: PropTypes.object,
  }),
  /** To disable the button */
  disabled: PropTypes.bool,
  /** Function called when users click on one of the "Pay" buttons */
  onSubmit: PropTypes.func.isRequired,
  /** If set, will be displayed in the pay modal */
  error: PropTypes.string,
};

export default PayExpenseButton;
