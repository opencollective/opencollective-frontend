import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../lib/constants/order-status';
import i18nOrderStatus from '../lib/i18n/order-status';

import I18nFormatters from './I18nFormatters';
import StyledTag from './StyledTag';
import StyledTooltip from './StyledTooltip';

const getTransactionStatusMsgType = transaction => {
  if (transaction.isRefund) {
    return 'success';
  }
  if (transaction.isOrderRejected && transaction.isRefunded) {
    return 'error';
  }
  if (transaction.isRefunded) {
    return 'grey';
  }
  if (transaction.order?.status === ORDER_STATUS.PENDING) {
    return 'warning';
  }

  return 'success';
};

const msg = defineMessages({
  completed: {
    id: 'Order.Status.Completed',
    defaultMessage: 'Completed',
  },
  refunded: {
    id: 'Order.Status.Refunded',
    defaultMessage: 'Refunded',
  },
  rejected: {
    id: 'expense.rejected',
    defaultMessage: 'Rejected',
  },
});

const formatStatus = (intl, transaction) => {
  if (transaction.isRefund) {
    return intl.formatMessage(msg.completed);
  } else if (transaction.isOrderRejected && transaction.isRefunded) {
    return intl.formatMessage(msg.rejected);
  } else if (transaction.isRefunded) {
    return intl.formatMessage(msg.refunded);
  } else if ([ORDER_STATUS.PENDING].includes(transaction.order?.status)) {
    return i18nOrderStatus(intl, transaction.order.status);
  } else {
    return intl.formatMessage(msg.completed);
  }
};

const tooltipMessages = defineMessages({
  [ORDER_STATUS.PENDING]: {
    id: 'Order.Status.Pending',
    defaultMessage: 'Please follow the payment instructions in the confirmation email to complete your transaction.',
  },
});

const TransactionStatusTag = ({ transaction, ...props }) => {
  const intl = useIntl();

  const tag = (
    <StyledTag
      type={getTransactionStatusMsgType(transaction)}
      fontWeight="600"
      letterSpacing="0.8px"
      textTransform="uppercase"
      data-cy="expense-status-msg"
      {...props}
    >
      {formatStatus(intl, transaction)}
    </StyledTag>
  );

  if ([ORDER_STATUS.PENDING].includes(transaction.order?.status)) {
    return (
      <StyledTooltip content={() => intl.formatMessage(tooltipMessages[transaction.order.status], I18nFormatters)}>
        {tag}
      </StyledTooltip>
    );
  }
  return tag;
};

TransactionStatusTag.propTypes = {
  isRefund: PropTypes.bool,
  isRefunded: PropTypes.bool,
  isOrderRejected: PropTypes.bool,
  isProcessingOrPending: PropTypes.bool,
  transaction: PropTypes.shape({
    type: PropTypes.string,
    isRefund: PropTypes.bool,
    isRefunded: PropTypes.bool,
    isOrderRejected: PropTypes.bool,
    isProcessingOrPending: PropTypes.bool,
    order: PropTypes.shape({
      status: PropTypes.string,
    }),
  }),
};

export default TransactionStatusTag;
