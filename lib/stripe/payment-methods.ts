/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PaymentMethod } from '@stripe/stripe-js';
import { startCase } from 'lodash';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

// https://stripe.com/docs/api/payment_methods/create#create_payment_method-type
enum StripePaymentMethod {
  acss_debit = 'acss_debit',
  afterpay_clearpay = 'afterpay_clearpay',
  alipay = 'alipay',
  au_becs_debit = 'au_becs_debit',
  bacs_debit = 'bacs_debit',
  bancontact = 'bancontact',
  blik = 'blik',
  boleto = 'boleto',
  card = 'card',
  customer_balance = 'customer_balance',
  eps = 'eps',
  fpx = 'fpx',
  giropay = 'giropay',
  grabpay = 'grabpay',
  ideal = 'ideal',
  klarna = 'klarna',
  konbini = 'konbini',
  link = 'link',
  oxxo = 'oxxo',
  p24 = 'p24',
  paynow = 'paynow',
  pix = 'pix',
  promptpay = 'promptpay',
  sepa_debit = 'sepa_debit',
  sofort = 'sofort',
  us_bank_account = 'us_bank_account',
  wechat_pay = 'wechat_pay',
  swish = 'swish',
}

const RestrictedCurrencyByStripePaymentMethod: Partial<Record<StripePaymentMethod, string[]>> = {
  [StripePaymentMethod.bacs_debit]: ['gbp'],
  [StripePaymentMethod.bancontact]: ['eur'],
  [StripePaymentMethod.sepa_debit]: ['eur'],
  [StripePaymentMethod.ideal]: ['eur'],
  [StripePaymentMethod.sofort]: ['eur'],
  [StripePaymentMethod.us_bank_account]: ['usd'],
};

export function isStripePaymentMethodEnabledForCurrency(paymentMethod, currency: string): boolean {
  const allowedCurrencyList = RestrictedCurrencyByStripePaymentMethod[paymentMethod.toLowerCase()];
  if (!allowedCurrencyList) {
    return true;
  }

  return allowedCurrencyList.includes(currency.toLowerCase());
}

/**
 * Formats the payment method label for the given payment method, translating it if it's a type (credit card, SEPA Direct Debit, etc.)
 * or returning the name if it's a service (Apple Pay, Google Pay, etc.).
 */
export const getStripePaymentMethodLabel = (intl: IntlShape, paymentMethod: string): string => {
  // Translated
  if (paymentMethod === StripePaymentMethod.acss_debit) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.acss_debit', defaultMessage: 'ACSS Debit' });
  } else if (paymentMethod === StripePaymentMethod.au_becs_debit) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.au_becs_debit', defaultMessage: 'BECS Direct Debit' });
  } else if (paymentMethod === StripePaymentMethod.bacs_debit) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.bacs_debit', defaultMessage: 'Bacs Direct Debit' });
  } else if (paymentMethod === StripePaymentMethod.card) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.card', defaultMessage: 'Card' });
  } else if (paymentMethod === StripePaymentMethod.customer_balance) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.customer_balance', defaultMessage: 'Stripe Balance' });
  } else if (paymentMethod === StripePaymentMethod.sepa_debit) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.sepa_debit', defaultMessage: 'SEPA Direct Debit' });
  } else if (paymentMethod === StripePaymentMethod.us_bank_account) {
    return intl.formatMessage({ id: 'Stripe.PaymentMethod.Label.us_bank_account', defaultMessage: 'ACH Direct Debit' });
  }
  // Not translated, but special formatting
  else if (paymentMethod === StripePaymentMethod.afterpay_clearpay) {
    return 'Afterpay / Clearpay';
  } else if (paymentMethod === StripePaymentMethod.eps) {
    return 'EPS';
  } else if (paymentMethod === StripePaymentMethod.fpx) {
    return 'FPX';
  } else if (paymentMethod === StripePaymentMethod.ideal) {
    return 'iDEAL';
  } else if (paymentMethod === StripePaymentMethod.oxxo) {
    return 'OXXO';
  } else if (paymentMethod === StripePaymentMethod.p24) {
    return 'Przelewy24';
  } else if (paymentMethod === StripePaymentMethod.wechat_pay) {
    return 'WeChat Pay';
  }
  // Fallback: amazon_pay => Amazon Pay
  else {
    return startCase(paymentMethod);
  }
};
