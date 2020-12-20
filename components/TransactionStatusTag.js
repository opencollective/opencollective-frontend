import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import StyledTag from './StyledTag';

const getTransactionStatusMsgType = (isRefund, isRefunded, isOrderRejected) => {
  if (isRefund) {
    return 'success';
  }
  if (isOrderRejected && isRefunded) {
    return 'error';
  }
  if (isRefunded) {
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

const formatStatus = (intl, isRefund, isRefunded, isOrderRejected) => {
  if (isRefund) {
    return intl.formatMessage(msg.completed);
  } else if (isOrderRejected && isRefunded) {
    return intl.formatMessage(msg.rejected);
  } else if (isRefunded) {
    return intl.formatMessage(msg.refunded);
  } else {
    return intl.formatMessage(msg.completed);
  }
};

const TransactionStatusTag = ({ isRefund, isRefunded, isOrderRejected, ...props }) => {
  const intl = useIntl();
  return (
    <StyledTag
      type={getTransactionStatusMsgType(isRefund, isRefunded, isOrderRejected)}
      fontWeight="600"
      letterSpacing="0.8px"
      textTransform="uppercase"
      data-cy="expense-status-msg"
      {...props}
    >
      {formatStatus(intl, isRefund, isRefunded, isOrderRejected)}
    </StyledTag>
  );
};

TransactionStatusTag.propTypes = {
  isRefund: PropTypes.bool,
  isRefunded: PropTypes.bool,
  isOrderRejected: PropTypes.bool,
};

export default TransactionStatusTag;
