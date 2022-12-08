import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import LoadingPlaceholder from '../LoadingPlaceholder';
import OrdersList from '../orders/OrdersList';
import { P } from '../Text';

import EmptyCollectivesSectionImageSVG from '../collective-page/images/EmptyCollectivesSectionImage.svg';

const ProcessingContributions = ({ orders, isLoading }) => {
  if (isLoading) {
    return <LoadingPlaceholder maxHeight="400px" mt={3} />;
  }

  return (
    <Box mt={3}>
      {orders.length ? (
        <OrdersList isLoading={isLoading} orders={orders} showPlatformTip={true} showAmountSign={false} />
      ) : (
        <Flex flexDirection="column" alignItems="center" py={4}>
          <Image src={EmptyCollectivesSectionImageSVG} alt="" width={309} height={200} />
          <P color="black.600" fontSize="16px" mt={5}>
            <FormattedMessage
              id="ProcessingContributions.none"
              defaultMessage="No processing contributions to see here! 👀"
            />
          </P>
        </Flex>
      )}
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
