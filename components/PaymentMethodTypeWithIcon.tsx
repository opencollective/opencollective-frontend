import React from 'react';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { StripeS as StripeIcon } from '@styled-icons/fa-brands/StripeS';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { useIntl } from 'react-intl';

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
  iconOnly?: boolean;
};

const ICONS = {
  [PAYMENT_METHOD_TYPE.GIFTCARD]: props => <GiftCard color="#9D9FA3" {...props} />,
  [PAYMENT_METHOD_TYPE.CREDITCARD]: props => <CreditCard color="#9D9FA3" {...props} />,
  [PAYMENT_METHOD_TYPE.PAYMENT]: props => <PaypalIcon color="#192f86" {...props} />,
  [PAYMENT_METHOD_TYPE.SUBSCRIPTION]: props => <PaypalIcon color="#192f86" {...props} />,
  [PAYMENT_METHOD_TYPE.PAYMENT_INTENT]: props => <StripeIcon color="#6772e5" {...props} />,
  OTHER: props => <OtherIcon color="#9D9FA3" {...props} />,
};

const LABELS = {
  [PAYMENT_METHOD_TYPE.PAYMENT]: 'PayPal',
  [PAYMENT_METHOD_TYPE.SUBSCRIPTION]: 'PayPal',
  [PAYMENT_METHOD_TYPE.PAYMENT_INTENT]: 'Stripe Payment Intent',
};

const PaymentMethodTypeWithIcon = ({ isLoading, type, iconSize = 24, iconOnly }: PaymentMethodTypeWithIconProps) => {
  const intl = useIntl();
  if (isLoading) {
    return <LoadingPlaceholder height={15} width={90} />;
  }

  if (!type) {
    return null;
  }

  const Icon = ICONS[type] || ICONS.OTHER;
  const Label = LABELS[type] || i18nPaymentMethodType(intl, type);

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-help align-middle">
          <Icon size={iconSize} />{' '}
        </TooltipTrigger>
        <TooltipContent>{Label}</TooltipContent>
      </Tooltip>
    );
  } else {
    return (
      <Flex alignItems="center">
        <Icon size={iconSize} />
        <Span ml={2}>{Label}</Span>
      </Flex>
    );
  }
};

// @component
export default PaymentMethodTypeWithIcon;
