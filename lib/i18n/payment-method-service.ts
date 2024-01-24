import { defineMessages } from 'react-intl';

import { PAYMENT_METHOD_SERVICE } from '../constants/payment-methods';

const messages = defineMessages({
  [PAYMENT_METHOD_SERVICE.BANK]: {
    id: 'paymentMethodService.bank',
    defaultMessage: 'Bank Account',
  },
});

export const i18nPaymentMethodService = (service, intl) => {
  const PaymentMethodServiceI18n = {
    [PAYMENT_METHOD_SERVICE.PAYPAL]: 'PayPal',
    [PAYMENT_METHOD_SERVICE.WISE]: 'Wise',
    [PAYMENT_METHOD_SERVICE.BANK]: intl.formatMessage(messages[PAYMENT_METHOD_SERVICE.BANK]),
  };

  const i18nMsg = PaymentMethodServiceI18n[service];
  return i18nMsg || service;
};
