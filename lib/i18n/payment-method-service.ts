import { defineMessages } from 'react-intl';

import { PAYMENT_METHOD_SERVICE } from '../constants/payment-methods';

const i18nPaymentMethodServiceLabels = defineMessages({
  [PAYMENT_METHOD_SERVICE.STRIPE]: {
    defaultMessage: 'Stripe',
    id: 'PaymentMethod.Stripe',
  },
  [PAYMENT_METHOD_SERVICE.WISE]: {
    defaultMessage: 'Wise',
    id: 'PaymentMethod.Wise',
  },
  [PAYMENT_METHOD_SERVICE.OPENCOLLECTIVE]: {
    defaultMessage: 'Open Collective',
    id: 'D8SXQU',
  },
  [PAYMENT_METHOD_SERVICE.THEGIVINGBLOCK]: {
    defaultMessage: 'The Giving Block',
    id: 'PaymentMethod.TheGivingBlock',
  },
  [PAYMENT_METHOD_SERVICE.PAYPAL]: {
    defaultMessage: 'PayPal',
    id: 'PayoutMethod.Type.Paypal',
  },
});

export const i18nPaymentMethodService = (intl, service) => {
  const i18nMsg = i18nPaymentMethodServiceLabels[service];
  return i18nMsg ? intl.formatMessage(i18nMsg) : service;
};
