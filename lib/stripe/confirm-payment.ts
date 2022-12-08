/* eslint-disable camelcase */
import { PaymentIntentConfirmParams, Stripe, StripeElements } from '@stripe/stripe-js';

import { PAYMENT_METHOD_TYPE } from '../constants/payment-methods';

type PaymentData = {
  type: keyof typeof PAYMENT_METHOD_TYPE;
  elements?: StripeElements;
  paymentMethodId?: string;
  returnUrl?: string;
};

type ConfirmParams = PaymentIntentConfirmParams | { payment_method?: string };

export async function confirmPayment(stripe: Stripe, clientSecret: string, paymentData: PaymentData) {
  const confirmParams: ConfirmParams = paymentData?.paymentMethodId
    ? {
        payment_method: paymentData.paymentMethodId,
      }
    : undefined;

  switch (paymentData.type) {
    case PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT: {
      return stripe.confirmUsBankAccountPayment(clientSecret, confirmParams);
    }
    case PAYMENT_METHOD_TYPE.SEPA_DEBIT: {
      return stripe.confirmSepaDebitPayment(clientSecret, confirmParams);
    }
    case PAYMENT_METHOD_TYPE.PAYMENT_INTENT: {
      return stripe.confirmPayment({
        elements: paymentData.elements,
        confirmParams: {
          return_url: paymentData.returnUrl,
        },
      });
    }
  }
}
