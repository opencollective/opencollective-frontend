import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';

import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';

type OrderPaymentMethodProps = {
  order: {
    paymentMethod?: { type?: string | null } | null;
    manualPaymentProvider?: { name: string } | null;
    pendingContributionData?: { paymentMethod?: string | null } | null;
  };
  iconSize?: number;
};

/**
 * Displays how a contribution was paid. Falls back to "Unknown" when the payment method is not
 * available, for example because its owner removed it.
 */
const OrderPaymentMethod = ({ order, iconSize = 16 }: OrderPaymentMethodProps) => {
  const intl = useIntl();
  if (order.paymentMethod) {
    return <PaymentMethodTypeWithIcon type={order.paymentMethod.type} iconSize={iconSize} />;
  } else if (order.manualPaymentProvider) {
    return <React.Fragment>{order.manualPaymentProvider.name}</React.Fragment>;
  } else if (order.pendingContributionData?.paymentMethod) {
    return (
      <React.Fragment>
        {i18nPaymentMethodProviderType(intl, order.pendingContributionData.paymentMethod)}
      </React.Fragment>
    );
  } else {
    return <FormattedMessage defaultMessage="Unknown" id="Unknown" />;
  }
};

export default OrderPaymentMethod;
