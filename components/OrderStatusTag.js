import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../lib/constants/order-status';

import StyledTag from './StyledTag';

const getExpenseStatusMsgType = (status, isRefund) => {
  if (isRefund) {
    return 'grey';
  }

  switch (status) {
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.ERROR:
      return 'error';
    case ORDER_STATUS.EXPIRED:
      return 'warning';
    case ORDER_STATUS.PAID:
    case ORDER_STATUS.ACTIVE:
      return 'success';
    case ORDER_STATUS.PENDING:
    default:
      return 'info';
  }
};

const msg = defineMessages({
  [ORDER_STATUS.CANCELLED]: {
    id: 'order.cancelled',
    defaultMessage: 'cancelled',
  },
  [ORDER_STATUS.ERROR]: {
    id: 'order.error',
    defaultMessage: 'error',
  },
  [ORDER_STATUS.EXPIRED]: {
    id: 'order.expired',
    defaultMessage: 'expired',
  },
  [ORDER_STATUS.PENDING]: {
    id: 'order.pending',
    defaultMessage: 'pending',
  },
  [ORDER_STATUS.NEW]: {
    id: 'order.new',
    defaultMessage: 'new',
  },
  [ORDER_STATUS.REQUIRE_CLIENT_CONFIRMATION]: {
    id: 'order.require_client_confirmation',
    defaultMessage: 'require client confirmation',
  },
  [ORDER_STATUS.PLEDGED]: {
    id: 'order.pledged',
    defaultMessage: 'pledged',
  },
  completed: {
    id: 'Order.Status.Completed',
    defaultMessage: 'Completed',
  },
  refunded: {
    id: 'Order.Status.Refunded',
    defaultMessage: 'Refunded',
  },
});

const formatStatus = (intl, status, isRefund) => {
  if (isRefund) {
    return intl.formatMessage(msg.refunded);
  } else if (status === ORDER_STATUS.ACTIVE || status === ORDER_STATUS.PAID) {
    return intl.formatMessage(msg.completed);
  } else if (msg[status]) {
    return intl.formatMessage(msg[status]);
  }
};

const OrderStatusTag = ({ status, isRefund, ...props }) => {
  const intl = useIntl();
  return (
    <StyledTag
      type={getExpenseStatusMsgType(status, isRefund)}
      fontWeight="600"
      letterSpacing="0.8px"
      textTransform="uppercase"
      data-cy="expense-status-msg"
      {...props}
    >
      {formatStatus(intl, status, isRefund)}
    </StyledTag>
  );
};

OrderStatusTag.propTypes = {
  status: PropTypes.oneOf(Object.values(ORDER_STATUS)),
  isRefund: PropTypes.bool,
};

export default OrderStatusTag;
