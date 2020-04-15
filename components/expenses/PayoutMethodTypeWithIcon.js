import { Flex } from '@rebass/grid';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { University as BankIcon } from '@styled-icons/fa-solid/University';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import PropTypes from 'prop-types';
import React from 'react';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { Span } from '../Text';
import { FormattedMessage } from 'react-intl';

/**
 * Shows the data of the given payout method
 */
const PayoutMethodTypeWithIcon = ({ type }) => {
  switch (type) {
    case PayoutMethodType.PAYPAL:
      return (
        <Flex alignItems="center">
          <PaypalIcon size={24} color="#192f86" />
          <Span ml={2} fontWeight="bold" fontSize="13px" color="black.900">
            PayPal
          </Span>
        </Flex>
      );
    case PayoutMethodType.OTHER:
      return (
        <Flex alignItems="center">
          <OtherIcon size={24} color="#9D9FA3" />
          <Span ml={2} fontWeight="bold" fontSize="13px" color="black.900">
            <FormattedMessage id="PayoutMethod.Type.Other" defaultMessage="Other" />
          </Span>
        </Flex>
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return (
        <Flex alignItems="center">
          <BankIcon size={24} color="#9D9FA3" />
          <Span ml={2} fontWeight="bold" fontSize="13px" color="black.900">
            <FormattedMessage id="Bank account" defaultMessage="Bank account" />
          </Span>
        </Flex>
      );
    default:
      return null;
  }
};

PayoutMethodTypeWithIcon.propTypes = {
  type: PropTypes.oneOf(Object.values(PayoutMethodType)),
};

// @component
export default PayoutMethodTypeWithIcon;
