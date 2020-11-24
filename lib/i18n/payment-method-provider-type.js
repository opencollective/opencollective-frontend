import { GQLV2_PAYMENT_METHOD_TYPES } from '../constants/payment-methods';

const { defineMessages } = require('react-intl');

const i18nTypes = defineMessages({
  [GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD]: {
    id: 'creditcard.label',
    defaultMessage: 'Credit Card',
  },
  [GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER]: {
    id: 'PayoutMethod.Type.BankAccount',
    defaultMessage: 'Bank transfer',
  },
  [GQLV2_PAYMENT_METHOD_TYPES.GIFT_CARD]: {
    id: 'GiftCard',
    defaultMessage: 'Gift card',
  },
  [GQLV2_PAYMENT_METHOD_TYPES.PREPAID_BUDGET]: {
    id: 'Prepaid',
    defaultMessage: 'Prepaid',
  },
  [GQLV2_PAYMENT_METHOD_TYPES.ACCOUNT_BALANCE]: {
    id: 'ServiceBalance',
    defaultMessage: '{service} balance',
  },
});

/**
 * Similar to ``, but specialized for the GQLV2's `PaymentMethodType`
 * from `paymentMethod.providerType`
 */
export const i18nPaymentMethodProviderType = (intl, type) => {
  if (type === GQLV2_PAYMENT_METHOD_TYPES.PAYPAL) {
    return 'PayPal';
  } else if (i18nTypes[type]) {
    return intl.formatMessage(i18nTypes[type], { service: 'Open Collective' });
  } else {
    return type;
  }
};
