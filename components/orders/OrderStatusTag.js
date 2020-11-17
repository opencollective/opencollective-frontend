import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import i18nOrderStatus from '../../lib/i18n/order-status';

import StyledTag from '../StyledTag';

const getTagType = status => {
  if ([ORDER_STATUS.ERROR, ORDER_STATUS.EXPIRED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED].includes(status)) {
    return 'error';
  } else if ([ORDER_STATUS.ACTIVE, ORDER_STATUS.PAID].includes(status)) {
    return 'success';
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
      data-cy="expense-status-msg"
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
