import React from 'react';
import PropTypes from 'prop-types';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { University as BankIcon } from '@styled-icons/fa-solid/University';
import { FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';

import { Flex } from '../Grid';
import { Span } from '../Text';

/**
 * Shows the data of the given payout method
 */
const PayoutMethodTypeWithIcon = ({ type, fontSize, iconSize }) => {
  switch (type) {
    case PayoutMethodType.PAYPAL:
      return (
        <Flex alignItems="center">
          <PaypalIcon size={iconSize} color="#192f86" />
          <Span ml={2} fontWeight="bold" fontSize={fontSize} color="black.900">
            PayPal
          </Span>
        </Flex>
      );
    case PayoutMethodType.OTHER:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight="bold" fontSize={fontSize} color="black.900">
            <FormattedMessage id="PayoutMethod.Type.Other" defaultMessage="Other" />
          </Span>
        </Flex>
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return (
        <Flex alignItems="center">
          <BankIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight="bold" fontSize={fontSize} color="black.900">
            <FormattedMessage id="BankAccount" defaultMessage="Bank account" />
          </Span>
        </Flex>
      );
    default:
      return null;
  }
};

PayoutMethodTypeWithIcon.propTypes = {
  type: PropTypes.oneOf(Object.values(PayoutMethodType)),
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  iconSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PayoutMethodTypeWithIcon.defaultProps = {
  fontSize: '13px',
  iconSize: 24,
};

// @component
export default PayoutMethodTypeWithIcon;
