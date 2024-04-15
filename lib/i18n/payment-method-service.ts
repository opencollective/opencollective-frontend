import { defineMessages } from 'react-intl';

import { PAYMENT_METHOD_SERVICE } from '../constants/payment-methods';

export const i18nPaymentMethodServiceLabels = defineMessages({
  [PAYMENT_METHOD_SERVICE.STRIPE]: {
    defaultMessage: 'Stripe',
    id: 'iBmKeP',
  },
  [PAYMENT_METHOD_SERVICE.WISE]: {
    defaultMessage: 'Wise',
    id: 'cSAdoG',
  },
  [PAYMENT_METHOD_SERVICE.OPENCOLLECTIVE]: {
    defaultMessage: 'Open Collective',
    id: 'D8SXQU',
  },
  [PAYMENT_METHOD_SERVICE.THEGIVINGBLOCK]: {
    defaultMessage: 'The Giving Block',
    id: 'pnE7R2',
  },
  [PAYMENT_METHOD_SERVICE.PAYPAL]: {
    defaultMessage: 'PayPal',
    id: 'PayoutMethod.Type.Paypal',
  },
  [PAYMENT_METHOD_SERVICE.PREPAID]: {
    defaultMessage: 'Prepaid',
    id: 'DLD6I0',
  },
});

export const i18nPaymentMethodService = (intl, service) => {
  const i18nMsg = i18nPaymentMethodServiceLabels[service];
  return i18nMsg ? intl.formatMessage(i18nMsg) : service;
};
