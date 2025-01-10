import React from 'react';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { StripeS as StripeIcon } from '@styled-icons/fa-brands/StripeS';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { FormattedMessage, useIntl } from 'react-intl';

import { PAYMENT_METHOD_TYPE } from '../lib/constants/payment-methods';
import { i18nPaymentMethodType } from '../lib/i18n/payment-method-type';

import GiftCard from './icons/GiftCard';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { Flex } from './Grid';
import LoadingPlaceholder from './LoadingPlaceholder';
import { Span } from './Text';

type PaymentMethodTypeWithIconProps = {
  isLoading?: boolean;
  type?: string;
  iconSize?: string | number;
  color?: string;
  iconOnly?: boolean;
};

const ICONS = {
  [PAYMENT_METHOD_TYPE.GIFTCARD]: ({ color, ...props }) => <GiftCard color={color || '#9D9FA3'} {...props} />,
  [PAYMENT_METHOD_TYPE.CREDITCARD]: ({ color, ...props }) => <CreditCard color={color || '#9D9FA3'} {...props} />,
  [PAYMENT_METHOD_TYPE.PAYMENT]: ({ color, ...props }) => <PaypalIcon color={color || '#192f86'} {...props} />,
  [PAYMENT_METHOD_TYPE.SUBSCRIPTION]: ({ color, ...props }) => <PaypalIcon color={color || '#192f86'} {...props} />,
  [PAYMENT_METHOD_TYPE.PAYMENT_INTENT]: ({ color, ...props }) => <StripeIcon color={color || '#6772e5'} {...props} />,
  OTHER: ({ color, ...props }) => <OtherIcon color={color || '#9D9FA3'} {...props} />,
};

export const PaymentMethodTypeLabel = ({ type }) => {
  const intl = useIntl();
  const LABELS = {
    [PAYMENT_METHOD_TYPE.PAYMENT]: 'PayPal',
    [PAYMENT_METHOD_TYPE.SUBSCRIPTION]: 'PayPal',
    [PAYMENT_METHOD_TYPE.PAYMENT_INTENT]: 'Stripe Payment Intent',
  };
  return (
    LABELS[type] || i18nPaymentMethodType(intl, type) || <FormattedMessage id="user.Unknown" defaultMessage="Unknown" />
  );
};

const PaymentMethodTypeWithIcon = ({
  isLoading,
  type,
  color,
  iconSize = 24,
  iconOnly,
}: PaymentMethodTypeWithIconProps) => {
  if (isLoading) {
    return <LoadingPlaceholder height={15} width={90} />;
  }

  const Icon = ICONS[type] || ICONS.OTHER;
  const Label = <PaymentMethodTypeLabel type={type} />;

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-help align-middle">
          <Icon size={iconSize} color={color} />{' '}
        </TooltipTrigger>
        <TooltipContent>{Label}</TooltipContent>
      </Tooltip>
    );
  } else {
    return (
      <Flex alignItems="center">
        <Icon size={iconSize} color={color} />
        <Span ml={2}>{Label}</Span>
      </Flex>
    );
  }
};

// @component
export default PaymentMethodTypeWithIcon;
