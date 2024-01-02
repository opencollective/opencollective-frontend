/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PaymentMethod } from '@stripe/stripe-js';
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
}

export const RestrictedCurrencyByStripePaymentMethod: Partial<Record<StripePaymentMethod, string[]>> = {
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

export const StripePaymentMethodsLabels = defineMessages<StripePaymentMethod>({
  [StripePaymentMethod.acss_debit]: { id: 'Stripe.PaymentMethod.Label.acss_debit', defaultMessage: 'ACSS Debit' },
  [StripePaymentMethod.afterpay_clearpay]: {
    id: 'Stripe.PaymentMethod.Label.afterpay_clearpay',
    defaultMessage: 'Afterpay / Clearpay',
  },
  [StripePaymentMethod.alipay]: { id: 'Stripe.PaymentMethod.Label.alipay', defaultMessage: 'Alipay' },
  [StripePaymentMethod.au_becs_debit]: {
    id: 'Stripe.PaymentMethod.Label.au_becs_debit',
    defaultMessage: 'BECS Direct Debit',
  },
  [StripePaymentMethod.bacs_debit]: {
    id: 'Stripe.PaymentMethod.Label.bacs_debit',
    defaultMessage: 'Bacs Direct Debit',
  },
  [StripePaymentMethod.bancontact]: { id: 'Stripe.PaymentMethod.Label.bancontact', defaultMessage: 'Bancontact' },
  [StripePaymentMethod.blik]: { id: 'Stripe.PaymentMethod.Label.blik', defaultMessage: 'BLIK' },
  [StripePaymentMethod.boleto]: { id: 'Stripe.PaymentMethod.Label.boleto', defaultMessage: 'Boleto' },
  [StripePaymentMethod.card]: { id: 'Stripe.PaymentMethod.Label.card', defaultMessage: 'Card' },
  [StripePaymentMethod.customer_balance]: {
    id: 'Stripe.PaymentMethod.Label.customer_balance',
    defaultMessage: 'Stripe Balance',
  },
  [StripePaymentMethod.eps]: { id: 'Stripe.PaymentMethod.Label.eps', defaultMessage: 'EPS' },
  [StripePaymentMethod.fpx]: { id: 'Stripe.PaymentMethod.Label.fpx', defaultMessage: 'FPX' },
  [StripePaymentMethod.giropay]: { id: 'Stripe.PaymentMethod.Label.giropay', defaultMessage: 'giropay' },
  [StripePaymentMethod.grabpay]: { id: 'Stripe.PaymentMethod.Label.grabpay', defaultMessage: 'GrabPay' },
  [StripePaymentMethod.ideal]: { id: 'Stripe.PaymentMethod.Label.ideal', defaultMessage: 'iDEAL' },
  [StripePaymentMethod.klarna]: { id: 'Stripe.PaymentMethod.Label.klarna', defaultMessage: 'Klarna' },
  [StripePaymentMethod.konbini]: { id: 'Stripe.PaymentMethod.Label.konbini', defaultMessage: 'Konbini' },
  [StripePaymentMethod.link]: { id: 'Stripe.PaymentMethod.Label.link', defaultMessage: 'Link' },
  [StripePaymentMethod.oxxo]: { id: 'Stripe.PaymentMethod.Label.oxxo', defaultMessage: 'OXXO' },
  [StripePaymentMethod.p24]: { id: 'Stripe.PaymentMethod.Label.p24', defaultMessage: 'Przelewy24' },
  [StripePaymentMethod.paynow]: { id: 'Stripe.PaymentMethod.Label.paynow', defaultMessage: 'PayNow' },
  [StripePaymentMethod.pix]: { id: 'Stripe.PaymentMethod.Label.pix', defaultMessage: 'Pix' },
  [StripePaymentMethod.promptpay]: { id: 'Stripe.PaymentMethod.Label.promptpay', defaultMessage: 'PromptPay' },
  [StripePaymentMethod.sepa_debit]: {
    id: 'Stripe.PaymentMethod.Label.sepa_debit',
    defaultMessage: 'SEPA Direct Debit',
  },
  [StripePaymentMethod.sofort]: { id: 'Stripe.PaymentMethod.Label.sofort', defaultMessage: 'Sofort' },
  [StripePaymentMethod.us_bank_account]: {
    id: 'Stripe.PaymentMethod.Label.us_bank_account',
    defaultMessage: 'ACH Direct Debit',
  },
  [StripePaymentMethod.wechat_pay]: { id: 'Stripe.PaymentMethod.Label.wechat_pay', defaultMessage: 'WeChat Pay' },
});
