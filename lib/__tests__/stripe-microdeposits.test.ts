import type { PaymentIntentResult } from '@stripe/stripe-js';

import {
  getMicrodepositVerificationUrl,
  isPaymentIntentAwaitingMicrodepositVerification,
} from '../stripe/microdeposits';

const HOSTED_VERIFICATION_URL = 'https://payments.stripe.com/microdeposit/pacs_test_123';

const awaitingVerification = {
  status: 'requires_action',
  // eslint-disable-next-line camelcase
  next_action: {
    type: 'verify_with_microdeposits',
    // eslint-disable-next-line camelcase
    verify_with_microdeposits: { hosted_verification_url: HOSTED_VERIFICATION_URL },
  },
} as unknown as PaymentIntentResult['paymentIntent'];

describe('lib/stripe/microdeposits', () => {
  describe('isPaymentIntentAwaitingMicrodepositVerification', () => {
    it('returns true when the bank account must be verified with microdeposits', () => {
      expect(isPaymentIntentAwaitingMicrodepositVerification(awaitingVerification)).toBe(true);
    });

    it('returns false for other statuses or next actions', () => {
      expect(isPaymentIntentAwaitingMicrodepositVerification(null)).toBe(false);
      expect(isPaymentIntentAwaitingMicrodepositVerification(undefined)).toBe(false);
      // eslint-disable-next-line camelcase
      expect(isPaymentIntentAwaitingMicrodepositVerification({ status: 'succeeded', next_action: null })).toBe(false);
      expect(
        isPaymentIntentAwaitingMicrodepositVerification({
          status: 'requires_action',
          // eslint-disable-next-line camelcase
          next_action: { type: 'redirect_to_url' },
        } as unknown as PaymentIntentResult['paymentIntent']),
      ).toBe(false);
      expect(
        isPaymentIntentAwaitingMicrodepositVerification({
          ...awaitingVerification,
          status: 'requires_payment_method',
        }),
      ).toBe(false);
    });
  });

  describe('getMicrodepositVerificationUrl', () => {
    it('returns the hosted verification URL', () => {
      expect(getMicrodepositVerificationUrl({ paymentIntent: awaitingVerification } as PaymentIntentResult)).toEqual(
        HOSTED_VERIFICATION_URL,
      );
    });

    it('returns null when not awaiting microdeposit verification', () => {
      expect(getMicrodepositVerificationUrl(null)).toBeNull();
      expect(
        getMicrodepositVerificationUrl({ error: { type: 'card_error' } } as unknown as PaymentIntentResult),
      ).toBeNull();
    });
  });
});
