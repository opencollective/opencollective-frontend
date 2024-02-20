import { defineMessages } from 'react-intl';

const i18nTypes = defineMessages({
  ADAPTIVE: { defaultMessage: 'PayPal Adaptive' },
  ALL: { id: 'PaymentMethods.All', defaultMessage: 'All' },
  BACS_DEBIT: { id: 'BacsDebit', defaultMessage: 'Bacs Debit' },
  BANCONTACT: { id: 'Stripe.PaymentMethod.Label.bancontact', defaultMessage: 'Bancontact' },
  BANK_TRANSFER: { defaultMessage: 'Bank Transfer (Wise)' },
  COLLECTIVE: { id: 'OpenCollectiveBalance', defaultMessage: 'Open Collective Balance' },
  CREDITCARD: { id: 'CreditCard', defaultMessage: 'Credit Card' },
  CRYPTO: { id: 'Crypto', defaultMessage: 'Crypto' },
  GIFTCARD: { id: 'GiftCard', defaultMessage: 'Gift Card' },
  HOST: { id: 'Host', defaultMessage: 'Fiscal Host (Added Funds)' },
  LINK: { defaultMessage: 'Link (Stripe)' },
  MANUAL: { id: 'Payout.Manual', defaultMessage: 'Manual' },
  PAYMENT: { defaultMessage: 'PayPal payment' },
  PAYOUT: { defaultMessage: 'PayPal payout' },
  PREPAID: { id: 'Prepaid', defaultMessage: 'Prepaid Card' },
  SEPA_DEBIT: { id: 'SEPADebit', defaultMessage: 'SEPA Debit' },
  SUBSCRIPTION: { defaultMessage: 'PayPal subscription' },
  US_BANK_ACCOUNT: { id: 'ACH Debit', defaultMessage: 'ACH Debit' },
  VIRTUAL_CARD: { id: 'PayoutMethod.Type.VirtualCard', defaultMessage: 'Virtual Card' },
  [null]: { id: 'PaymentMethods.None', defaultMessage: 'No payment method' },
  // For now, no need to support:
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
