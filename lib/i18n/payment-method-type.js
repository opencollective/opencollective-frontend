import { defineMessages } from 'react-intl';

const i18nTypes = defineMessages({
  ADAPTIVE: { id: 'PaymentMethod.PayPal.type.Adaptive', defaultMessage: 'Adaptive' },
  ALL: { id: 'PaymentMethods.All', defaultMessage: 'All' },
  BACS_DEBIT: { id: 'Stripe.PaymentMethod.Label.bacs_debit', defaultMessage: 'Bacs Direct Debit' },
  BANCONTACT: { id: 'Stripe.PaymentMethod.Label.bancontact', defaultMessage: 'Bancontact' },
  BANK_TRANSFER: { id: 'Aj4Xx4', defaultMessage: 'Bank Transfer' },
  COLLECTIVE: { id: 'PaymentMethod.OpenCollective.type.Collective', defaultMessage: 'Collective Balance' },
  CREDITCARD: { id: 'CreditCard', defaultMessage: 'Credit Card' },
  CRYPTO: { id: 'Crypto', defaultMessage: 'Crypto' },
  GIFTCARD: { id: 'GiftCard', defaultMessage: 'Gift Card' },
  HOST: { id: 'Host', defaultMessage: 'Fiscal Host (Added Funds)' },
  LINK: { id: 'Stripe.PaymentMethod.Label.link', defaultMessage: 'Link' },
  MANUAL: { id: 'Payout.Manual', defaultMessage: 'Manual' },
  PAYMENT: { id: 'ContributionFlow.Payment', defaultMessage: 'Payment' },
  PAYOUT: { id: 'Payout', defaultMessage: 'Payout' },
  PREPAID: { id: 'Prepaid', defaultMessage: 'Prepaid Card' },
  SEPA_DEBIT: { id: 'Stripe.PaymentMethod.Label.sepa_debit', defaultMessage: 'SEPA Direct Debit' },
  SUBSCRIPTION: { id: 'PaymentMethod.Paypal.type.Subscription', defaultMessage: 'Subscription' },
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
