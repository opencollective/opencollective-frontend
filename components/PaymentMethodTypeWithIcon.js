import React from 'react';
import PropTypes from 'prop-types';
import { Alipay } from '@styled-icons/fa-brands/Alipay';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { StripeS as StripeIcon } from '@styled-icons/fa-brands/StripeS';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { useIntl } from 'react-intl';

import { PAYMENT_METHOD_TYPE } from '../lib/constants/payment-methods';
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
    case PAYMENT_METHOD_TYPE.GIFTCARD:
      return (
        <Flex alignItems="center">
          <GiftCard size={iconSize} color="#9D9FA3" />
          <Span ml={2}>{i18nPaymentMethodType(intl, type)}</Span>
        </Flex>
      );
    case PAYMENT_METHOD_TYPE.CREDITCARD:
      return (
        <Flex alignItems="center">
          <CreditCard size={iconSize} color="#9D9FA3" />
          <Span ml={2}>{i18nPaymentMethodType(intl, type)}</Span>
        </Flex>
      );
    case PAYMENT_METHOD_TYPE.ALIPAY:
      return (
        <Flex alignItems="center">
          <Alipay size={iconSize} color="#9D9FA3" />
          <Span ml={2}>Alipay</Span>
        </Flex>
      );
    case PAYMENT_METHOD_TYPE.PAYMENT:
    case PAYMENT_METHOD_TYPE.SUBSCRIPTION:
      return (
        <Flex alignItems="center">
          <PaypalIcon size={iconSize} color="#192f86" />
          <Span ml={2}>PayPal</Span>
        </Flex>
      );
    case PAYMENT_METHOD_TYPE.PAYMENT_INTENT:
      return (
        <Flex alignItems="center">
          <StripeIcon size={iconSize} color="#6772e5" />
          <Span ml={2}>Stripe Payment Intent</Span>
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
  type: PropTypes.oneOf(Object.values(PAYMENT_METHOD_TYPE)),
  iconSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PaymentMethodTypeWithIcon.defaultProps = {
  iconSize: 24,
};

// @component
export default PaymentMethodTypeWithIcon;
