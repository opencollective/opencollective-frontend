import type { PaymentIntent, PaymentIntentResult } from '@stripe/stripe-js';

/**
 * When a US bank account (ACH) can't be verified instantly, Stripe leaves the payment intent in
 * `requires_action` with a `verify_with_microdeposits` next action and emails the payer a link to
 * confirm the deposits. The payment is waiting on that step: it has not failed.
 */
export const isPaymentIntentAwaitingMicrodepositVerification = (
  paymentIntent: Pick<PaymentIntent, 'status' | 'next_action'> | null | undefined,
): boolean => {
  return paymentIntent?.status === 'requires_action' && paymentIntent.next_action?.type === 'verify_with_microdeposits';
};

/**
 * Returns the Stripe-hosted page where the payer can confirm the microdeposits, if any.
 */
export const getMicrodepositVerificationUrl = (paymentIntentResult: PaymentIntentResult | null): string | null => {
  const paymentIntent = paymentIntentResult?.paymentIntent;
  if (!isPaymentIntentAwaitingMicrodepositVerification(paymentIntent)) {
    return null;
  }

  return paymentIntent.next_action.verify_with_microdeposits?.hosted_verification_url || null;
};
