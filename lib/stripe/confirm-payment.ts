/* eslint-disable camelcase */
import type { PaymentIntentResult, Stripe, StripeElements } from '@stripe/stripe-js';

import { PAYMENT_METHOD_TYPE } from '../constants/payment-methods';

type PaymentData = {
  type: keyof typeof PAYMENT_METHOD_TYPE;
  elements?: StripeElements;
  paymentMethodId?: string;
  returnUrl?: string;
};

type ConfirmParams = { payment_method?: string; return_url?: string };

export async function confirmPayment(
  stripe: Stripe,
  clientSecret: string,
  paymentData: PaymentData,
  { redirect }: { redirect?: 'if_required' } = {},
) {
  // `return_url` is required at confirmation whenever the PaymentIntent has automatic payment
  // methods enabled with `allow_redirects: always` (the default), even for non-redirect methods.
  const confirmParams: ConfirmParams = {
    ...(paymentData?.paymentMethodId && { payment_method: paymentData.paymentMethodId }),
    ...(paymentData?.returnUrl && { return_url: paymentData.returnUrl }),
  };

  let paymentIntentResult: PaymentIntentResult;
  switch (paymentData.type) {
    case PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT: {
      paymentIntentResult = await stripe.confirmUsBankAccountPayment(clientSecret, confirmParams);
      break;
    }
    case PAYMENT_METHOD_TYPE.SEPA_DEBIT: {
      paymentIntentResult = await stripe.confirmSepaDebitPayment(clientSecret, confirmParams);
      break;
    }
    case PAYMENT_METHOD_TYPE.PAYMENT_INTENT: {
      paymentIntentResult = await stripe.confirmPayment({
        elements: paymentData.elements,
        confirmParams: {
          return_url: paymentData.returnUrl,
        },
        redirect,
      });
      break;
    }
    case PAYMENT_METHOD_TYPE.CREDITCARD: {
      paymentIntentResult = await stripe.confirmCardPayment(clientSecret, confirmParams);
      break;
    }
    default: {
      throw new Error(`Unsupported payment type ${paymentData.type}`);
    }
  }

  if (paymentIntentResult.error) {
    throw new Error(paymentIntentResult.error.message, { cause: paymentIntentResult.error });
  }

  return paymentIntentResult.paymentIntent;
}
