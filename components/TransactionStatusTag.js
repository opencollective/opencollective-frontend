import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../lib/constants/order-status';
import i18nOrderStatus from '../lib/i18n/order-status';

import StyledTag from './StyledTag';

const getTransactionStatusMsgType = transaction => {
  if (transaction.isRefund) {
    return 'success';
  }
  if (transaction.isOrderRejected && transaction.isRefunded) {
    return 'error';
  }
  if (transaction.isRefunded || [ORDER_STATUS.PROCESSING, ORDER_STATUS.PENDING].includes(transaction.order?.status)) {
    return 'grey';
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
  } else if ([ORDER_STATUS.PROCESSING, ORDER_STATUS.PENDING].includes(transaction.order?.status)) {
    return i18nOrderStatus(intl, transaction.order.status);
  } else {
    return intl.formatMessage(msg.completed);
  }
};

const TransactionStatusTag = ({ transaction, ...props }) => {
  const intl = useIntl();
  return (
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
