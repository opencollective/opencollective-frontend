import { defineMessages } from 'react-intl';

const i18nTypes = defineMessages({
  ALL: {
    id: 'PaymentMethods.All',
    defaultMessage: 'All',
  },
  ADAPTIVE: {
    defaultMessage: 'PayPal Adaptive',
  },
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
  PAYMENT: {
    defaultMessage: 'PayPal payment',
  },
  SUBSCRIPTION: {
    defaultMessage: 'PayPal subscription',
  },
  US_BANK_ACCOUNT: { id: 'ACH Debit', defaultMessage: 'ACH Debit' },
  SEPA_DEBIT: { id: 'SEPADebit', defaultMessage: 'SEPA Debit' },
  BACS_DEBIT: { id: 'BacsDebit', defaultMessage: 'Bacs Debit' },
  BANCONTACT: { id: 'Stripe.PaymentMethod.Label.bancontact', defaultMessage: 'Bancontact' },
  [null]: {
    id: 'PaymentMethods.None',
    defaultMessage: 'No payment method',
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
