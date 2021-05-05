import React from 'react';
import PropTypes from 'prop-types';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { useIntl } from 'react-intl';

import { PaymentMethodType } from '../lib/constants/payment-methods';
import { i18nPaymentMethodType } from '../lib/i18n/payment-method-type';

import GiftCard from './icons/GiftCard';
import { Flex } from './Grid';
import LoadingPlaceholder from './LoadingPlaceholder';
import { Span } from './Text';

/**
 * Shows the data of the given payout method
 */
const PaymentMethodTypeWithIcon = ({ isLoading, type, iconSize }) => {
  const intl = useIntl();
  if (isLoading) {
    return <LoadingPlaceholder height={15} width={90} />;
  }

  switch (type) {
    case PaymentMethodType.GIFT_CARD:
      return (
        <Flex alignItems="center">
          <GiftCard size={iconSize} color="#9D9FA3" />
          <Span ml={2}>{i18nPaymentMethodType(intl, type)}</Span>
        </Flex>
      );
    case PaymentMethodType.CREDIT_CARD:
      return (
        <Flex alignItems="center">
          <CreditCard size={iconSize} color="#9D9FA3" />
          <Span ml={2}>{i18nPaymentMethodType(intl, type)}</Span>
        </Flex>
      );
    case PaymentMethodType.PAYMENT:
      return (
        <Flex alignItems="center">
          <PaypalIcon size={iconSize} color="#192f86" />
          <Span ml={2}>PayPal</Span>
        </Flex>
      );
    case PaymentMethodType.COLLECTIVE:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2}>{i18nPaymentMethodType(intl, type)}</Span>
        </Flex>
      );
    default:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2}>{i18nPaymentMethodType(intl, type)}</Span>
        </Flex>
      );
  }
};

PaymentMethodTypeWithIcon.propTypes = {
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf(Object.values(PaymentMethodType)),
  iconSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PaymentMethodTypeWithIcon.defaultProps = {
  iconSize: 24,
};

// @component
export default PaymentMethodTypeWithIcon;
