import { defineMessages } from 'react-intl';

const i18nTypes = defineMessages({
  GIFTCARD: {
    id: 'GiftCard',
    defaultMessage: 'Gift Card',
  },
  CREDITCARD: {
    id: 'CreditCard',
    defaultMessage: 'Credit Card',
  },
  PREPAID: {
    id: 'Prepaid',
    defaultMessage: 'Prepaid Card',
  },
  COLLECTIVE: {
    id: 'OpenCollectiveBalance',
    defaultMessage: 'Open Collective Balance',
  },
  HOST: {
    id: 'Host',
    defaultMessage: 'Fiscal Host (Added Funds)',
  },
  MANUAL: {
    id: 'Manual',
    defaultMessage: 'Manual (Bank Transfer)',
  },
  CRYPTO: {
    id: 'Crypto',
    defaultMessage: 'Crypto',
  },
  // For now, no need to support:
  // - PAYMENT -> "PayPal" doesn't need translation
  // - SUBSCRIPTION -> "PayPal" doesn't need translation
  // - ALIPAY -> "Alipay" doesn't need translation
});

/**
 * Get only the (i18n) name of the payment method type.
 *
 * Ex: i18nPaymentMethodType(intl, 'giftcard') === 'Gift card'
 */
export const i18nPaymentMethodType = (intl, type) => {
  return i18nTypes[type] ? intl.formatMessage(i18nTypes[type]) : type;
};
