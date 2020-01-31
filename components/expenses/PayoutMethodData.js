import PropTypes from 'prop-types';
import { get } from 'lodash';
import { PayoutMethodType } from '../../lib/constants/payout-method';

/**
 * Shows the data of the given payout method
 */
const PayoutMethodData = ({ payoutMethod }) => {
  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return get(payoutMethod, 'data.email');
    case PayoutMethodType.OTHER:
      return get(payoutMethod, 'data.content');
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
