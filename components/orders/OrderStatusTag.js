import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import i18nOrderStatus from '../../lib/i18n/order-status';

import StyledTag from '../StyledTag';

const getTagType = status => {
  if (
    [
      ORDER_STATUS.ERROR,
      ORDER_STATUS.EXPIRED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.REJECTED,
      ORDER_STATUS.DISPUTED,
      ORDER_STATUS.IN_REVIEW,
    ].includes(status)
  ) {
    return 'error';
  } else if ([ORDER_STATUS.ACTIVE, ORDER_STATUS.PAID].includes(status)) {
    return 'success';
  } else if (status === ORDER_STATUS.PAUSED) {
    return 'warning';
  } else {
    return 'info';
  }
};

const OrderStatusTag = ({ status, ...props }) => {
  const intl = useIntl();
  return (
    <StyledTag
      type={getTagType(status)}
      fontWeight="600"
      letterSpacing="0.8px"
      textTransform="uppercase"
      data-cy="order-status-msg"
      fontSize="10px"
      {...props}
    >
      {i18nOrderStatus(intl, status)}
    </StyledTag>
  );
};

OrderStatusTag.propTypes = {
  status: PropTypes.oneOf(Object.values(ORDER_STATUS)),
};

export default OrderStatusTag;
