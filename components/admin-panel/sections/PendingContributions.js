import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../../../lib/constants/order-status';

import OrdersWithData from '../../orders/OrdersWithData';

const FinancialContributions = ({ accountSlug }) => {
  return (
    <OrdersWithData
      status={ORDER_STATUS.PENDING}
      accountSlug={accountSlug}
      title={<FormattedMessage id="PendingContributions" defaultMessage="Pending Contributions" />}
      showPlatformTip
      canCreatePendingOrder
      showDisputesWarning
    />
  );
};

FinancialContributions.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default FinancialContributions;
