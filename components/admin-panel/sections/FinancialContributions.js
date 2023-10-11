import React from 'react';
import PropTypes from 'prop-types';

import OrdersWithData from '../../orders/OrdersWithData';

const FinancialContributions = ({ accountSlug }) => {
  return <OrdersWithData accountSlug={accountSlug} showPlatformTip showDisputesWarning />;
};

FinancialContributions.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default FinancialContributions;
