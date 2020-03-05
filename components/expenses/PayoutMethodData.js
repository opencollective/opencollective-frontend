import React from 'react';
import PropTypes from 'prop-types';
import { get, isObject, startCase } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { Span, P } from '../Text';

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
 * @returns boolean: True if the payout method has displayable data
 */
export const payoutMethodHasData = payoutMethod => {
  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return Boolean(get(payoutMethod, 'data.email'));
    case PayoutMethodType.OTHER:
      return Boolean(get(payoutMethod, 'data.content'));
    case PayoutMethodType.BANK_ACCOUNT:
      return Boolean(get(payoutMethod, 'data.details'));
    default:
      return false;
  }
};

const PrivateFallback = () => (
  <Span color="black.500" fontStyle="italic">
    <FormattedMessage id="Private" defaultMessage="Private" />
  </Span>
);

/**
 * Shows the data of the given payout method
 */
const PayoutMethodData = ({ payoutMethod }) => {
  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return get(payoutMethod, 'data.email') || <PrivateFallback />;
    case PayoutMethodType.OTHER:
      return get(payoutMethod, 'data.content') || <PrivateFallback />;
    case PayoutMethodType.BANK_ACCOUNT:
      return payoutMethodHasData(payoutMethod) ? renderObject(payoutMethod.data) : <PrivateFallback />;
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
