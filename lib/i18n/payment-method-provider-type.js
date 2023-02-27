import { defineMessages } from 'react-intl';

// TODO(paymentMethodType): migrate to service+type
import { GQLV2_PAYMENT_METHOD_LEGACY_TYPES } from '../constants/payment-methods';

const i18nTypes = defineMessages({
  [GQLV2_PAYMENT_METHOD_LEGACY_TYPES.CREDIT_CARD]: {
    id: 'CreditCard',
    defaultMessage: 'Credit Card',
  },
  [GQLV2_PAYMENT_METHOD_LEGACY_TYPES.BANK_TRANSFER]: {
    id: 'Manual',
    defaultMessage: 'Manual (Bank Transfer)',
  },
  [GQLV2_PAYMENT_METHOD_LEGACY_TYPES.GIFT_CARD]: {
    id: 'GiftCard',
    defaultMessage: 'Gift Card',
  },
  [GQLV2_PAYMENT_METHOD_LEGACY_TYPES.PREPAID_BUDGET]: {
    id: 'Prepaid',
    defaultMessage: 'Prepaid Card',
  },
  [GQLV2_PAYMENT_METHOD_LEGACY_TYPES.ACCOUNT_BALANCE]: {
    id: 'ServiceBalance',
    defaultMessage: '{service} balance',
  },
  [GQLV2_PAYMENT_METHOD_LEGACY_TYPES.CRYPTO]: {
    id: 'Crypto',
    defaultMessage: 'Crypto',
  },
  // PENDING Contributions
  CHECK: {
    id: 'Check',
    defaultMessage: 'Check',
  },
  UNKNOWN: {
    id: 'Unknown',
    defaultMessage: 'Unknown',
  },
});

/**
 * Similar to ``, but specialized for the GQLV2's `PaymentMethodType`
 * from `paymentMethod.providerType`
 */
export const i18nPaymentMethodProviderType = (intl, providerType) => {
  if (providerType === GQLV2_PAYMENT_METHOD_LEGACY_TYPES.PAYPAL) {
    return 'PayPal';
  } else if (i18nTypes[providerType]) {
    return intl.formatMessage(i18nTypes[providerType], { service: 'Open Collective' });
  } else {
    return providerType;
  }
};
