import React from 'react';
import PropTypes from 'prop-types';
import { get, startCase, upperCase } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { P } from '../Text';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Container from '../Container';

const renderObject = object =>
  Object.entries(object).reduce((acc, [key, value]) => {
    return [
      ...acc,
      <P key={key} fontSize="11px" lineHeight="Caption">
        <FormattedMessage id="withColon" defaultMessage="{item}:" values={{ item: startCase(key) }} /> {value}
      </P>,
    ];
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

/**
 * Shows the data of the given payout method
 */
const PayoutMethodData = ({ payoutMethod }) => {
  if (!payoutMethodHasData(payoutMethod)) {
    return null;
  }

  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return (
        <div>
          <Container fontSize="11px" fontWeight="500" mb={2}>
            <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" />
            &nbsp;&nbsp;
            <PrivateInfoIcon color="#969BA3" />
          </Container>
          <P fontSize="11px" color="black.700">
            {payoutMethod.data.email}
          </P>
        </div>
      );
    case PayoutMethodType.OTHER:
      return (
        <div>
          <Container fontSize="11px" fontWeight="500" mb={2}>
            <FormattedMessage id="Details" defaultMessage="Details" />
            &nbsp;&nbsp;
            <PrivateInfoIcon color="#969BA3" />
          </Container>
          <P fontSize="11px" color="black.700">
            {payoutMethod.data.content}
          </P>
        </div>
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return (
        <div>
          <Container fontSize="11px" fontWeight="500" mb={2}>
            <FormattedMessage id="Details" defaultMessage="Details" />
            &nbsp;&nbsp;
            <PrivateInfoIcon color="#969BA3" />
          </Container>
          <Container fontSize="11px" color="black.700">
            <FormattedMessage
              id="BankInfo.Type"
              defaultMessage="Type: {type}"
              values={{ type: upperCase(payoutMethod.data.type) }}
            />
            {renderObject(payoutMethod.data.details)}
          </Container>
        </div>
      );
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
