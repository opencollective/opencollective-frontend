import PropTypes from 'prop-types';
import React from 'react';
import { get, isObject, startCase } from 'lodash';
import { PayoutMethodType } from '../../lib/constants/payout-method';

import { P } from '../Text';

const renderObject = object =>
  Object.entries(object).reduce((acc, next) => {
    const [key, value] = next;
    if (isObject(value)) {
      return [
        ...acc,
        <P key={key} fontSize="Caption" fontWeight="bold">
          {startCase(key)}
        </P>,
        ...renderObject(value),
      ];
    } else {
      return [
        ...acc,
        <P key={key} fontSize="Caption">
          {startCase(key)}: {value}
        </P>,
      ];
    }
  }, []);

/**
 * Shows the data of the given payout method
 */
const PayoutMethodData = ({ payoutMethod }) => {
  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return get(payoutMethod, 'data.email');
    case PayoutMethodType.OTHER:
      return get(payoutMethod, 'data.content');
    case PayoutMethodType.BANK_ACCOUNT:
      return payoutMethod.data?.details ? renderObject(payoutMethod.data) : null;
    default:
      return null;
  }
};

PayoutMethodData.propTypes = {
  payoutMethod: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.oneOf(Object.values(PayoutMethodType)),
    data: PropTypes.object,
  }),
};

// @component
export default PayoutMethodData;
