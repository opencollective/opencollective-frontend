import React from 'react';
import PropTypes from 'prop-types';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { University as BankIcon } from '@styled-icons/fa-solid/University';
import { FormattedMessage } from 'react-intl';

import { INVITE, PayoutMethodType } from '../../lib/constants/payout-method';

import Avatar from '../Avatar';
import { Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { Span } from '../Text';

/**
 * Shows the data of the given payout method
 */
const PayoutMethodTypeWithIcon = ({ isLoading, type, fontSize, fontWeight, color, iconSize }) => {
  if (isLoading) {
    return <LoadingPlaceholder height={15} width={90} />;
  }

  switch (type) {
    case PayoutMethodType.PAYPAL:
      return (
        <Flex alignItems="center">
          <PaypalIcon size={iconSize} color="#192f86" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            PayPal
          </Span>
        </Flex>
      );
    case PayoutMethodType.CREDIT_CARD:
      return (
        <Flex alignItems="center">
          <CreditCard size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="CreditCard" defaultMessage="Credit Card" />
          </Span>
        </Flex>
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return (
        <Flex alignItems="center">
          <BankIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="BankAccount" defaultMessage="Bank account" />
          </Span>
        </Flex>
      );
    case PayoutMethodType.ACCOUNT_BALANCE:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            Open Collective
          </Span>
        </Flex>
      );
    case INVITE:
      return (
        <Flex alignItems="center">
          <Avatar name="?" size={iconSize} backgroundColor="blue.100" color="blue.400" fontWeight="500" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="PayoutMethod.Type.ToBeDefined" defaultMessage="Not yet set" />
          </Span>
        </Flex>
      );
    case PayoutMethodType.OTHER:
    default:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="PayoutMethod.Type.Other" defaultMessage="Other" />
          </Span>
        </Flex>
      );
  }
};

PayoutMethodTypeWithIcon.propTypes = {
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf([...Object.values(PayoutMethodType), INVITE]),
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fontWeight: PropTypes.string,
  color: PropTypes.string,
  iconSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PayoutMethodTypeWithIcon.defaultProps = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'black.900',
  iconSize: 24,
};

// @component
export default PayoutMethodTypeWithIcon;
