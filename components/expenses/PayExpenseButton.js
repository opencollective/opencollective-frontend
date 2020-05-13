import React from 'react';
import PropTypes from 'prop-types';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { University as OtherIcon } from '@styled-icons/fa-solid/University';
import { FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';

import TransferwiseIcon from '../icons/TransferwiseIcon';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';

import PayExpenseModal from './PayExpenseModal';

const getDisabledMessage = (expense, collective, payoutMethod) => {
  const host = collective.host;
  if (!host) {
    return <FormattedMessage id="expense.pay.error.noHost" defaultMessage="Expenses cannot be payed without a host" />;
  } else if (collective.balance < expense.amount) {
    return <FormattedMessage id="expense.pay.error.insufficientBalance" defaultMessage="Insufficient balance" />;
  } else if (!payoutMethod) {
    return null;
  } else if (payoutMethod.type === PayoutMethodType.BANK_ACCOUNT) {
    const { transferwisePayouts, transferwisePayoutsLimit } = host.plan;
    if (transferwisePayoutsLimit !== null && transferwisePayouts >= transferwisePayoutsLimit) {
      return (
        <FormattedMessage
          id="expense.pay.transferwise.planlimit"
          defaultMessage="You reached your plan's limit, <Link>upgrade your plan</Link> to continue paying expense with TransferWise"
          values={{
            Link(message) {
              return <Link route={`/${host.slug}/edit/host-plan`}>{message}</Link>;
            },
          }}
        />
      );
    }
  }
};

const PayoutMethodTypeIcon = ({ type, ...props }) => {
  switch (type) {
    case PayoutMethodType.PAYPAL:
      return <PaypalIcon {...props} />;
    case PayoutMethodType.BANK_ACCOUNT:
      return <TransferwiseIcon {...props} />;
    default:
      return <OtherIcon {...props} />;
  }
};

PayoutMethodTypeIcon.propTypes = {
  type: PropTypes.oneOf(Object.values(PayoutMethodType)),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const PayExpenseButton = ({ expense, collective, disabled, onSubmit, error, ...props }) => {
  const [hasModal, showModal] = React.useState(false);
  const disabledMessage = getDisabledMessage(expense, collective, expense.payoutMethod);
  const isDisabled = Boolean(disabled || disabledMessage);

  const button = (
    <StyledButton
      buttonStyle="successSecondary"
      data-cy="pay-button"
      {...props}
      disabled={isDisabled}
      onClick={() => showModal(true)}
    >
      <PayoutMethodTypeIcon type={expense.payoutMethod?.type} size={12} />
      <Span ml="6px">
        <FormattedMessage id="actions.pay" defaultMessage="Pay" />
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
          onClose={() => showModal(false)}
          error={error}
          onSubmit={async values => {
            await onSubmit(values);
            showModal(false);
          }}
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
  }).isRequired,
  collective: PropTypes.shape({
    balance: PropTypes.number,
    currency: PropTypes.string,
    host: PropTypes.shape({
      plan: PropTypes.object,
    }),
  }).isRequired,
  /** To disable the button */
  disabled: PropTypes.bool,
  /** Function called when users click on one of the "Pay" buttons */
  onSubmit: PropTypes.func.isRequired,
  /** If set, will be displayed in the pay modal */
  error: PropTypes.string,
};

export default PayExpenseButton;
