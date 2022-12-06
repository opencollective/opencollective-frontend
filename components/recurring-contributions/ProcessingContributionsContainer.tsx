import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import OrdersList from '../orders/OrdersList';

const ProcessingContributions = ({ orders, isLoading }) => {
  if (isLoading) {
    return <LoadingPlaceholder maxHeight="400px" mt={3} />;
  }

  return (
    <Box mt={3}>
      <OrdersList isLoading={isLoading} orders={orders} showPlatformTip={true} showAmountSign={false} />
    </Box>
  );
};

ProcessingContributions.propTypes = {
  isLoading: PropTypes.bool,
  account: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }),
  ),
};

export default ProcessingContributions;
