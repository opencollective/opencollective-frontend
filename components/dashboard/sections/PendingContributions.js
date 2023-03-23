import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../../../lib/constants/order-status';

import OrdersWithData from '../../orders/OrdersWithData';

const FinancialContributions = ({ hostSlug }) => {
  return (
    <OrdersWithData
      status={ORDER_STATUS.PENDING}
      accountSlug={hostSlug}
      title={<FormattedMessage id="PendingContributions" defaultMessage="Pending Contributions" />}
      showPlatformTip
      canCreatePendingOrder
    />
  );
};

FinancialContributions.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default FinancialContributions;
