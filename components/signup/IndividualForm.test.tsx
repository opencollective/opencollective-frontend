import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { resendOTP, signup, verifyEmail } from '@/lib/api';
import { withRequiredProviders } from '../../test/providers';

import { isCaptchaEnabled } from '../Captcha';

import type { SignupStepProps } from './common';
import { SignupSteps } from './common';
import { EmailVerificationSteps } from './IndividualForm';

jest.mock('@/lib/api', () => ({
  signup: jest.fn(),
  resendOTP: jest.fn(),
  verifyEmail: jest.fn(),
}));

jest.mock('next/router', () => ({
  // Keep the real module: @sentry/nextjs instruments `Router.events` at import time
  ...jest.requireActual('next/router'),
  useRouter: () => ({
    query: { email: 'jane@example.com', session: 'sess-1' },
    pathname: '/signup/verify',
    replace: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ login: jest.fn() }),
}));

jest.mock('../ui/useToast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

jest.mock('../Captcha', () => ({
  __esModule: true,
  default: () => null,
  isCaptchaEnabled: jest.fn(() => false),
  resetCaptcha: jest.fn(),
}));

/** The OTP field renders through `input-otp`, which exposes no accessible role - locate by slot. */
const getOtpInput = () => {
  const input = document.querySelector('[data-slot="input-otp"]');
  if (!input) {
    throw new Error('Could not find the OTP input');
  }
  return input as HTMLElement;
};

const renderVerifyStep = (nextStep: jest.Mock) => {
  const props: SignupStepProps = { step: SignupSteps.VERIFY_OTP, nextStep };
  render(withRequiredProviders(<EmailVerificationSteps {...props} />));
};

describe('IndividualForm - EmailVerificationSteps error handling', () => {
  beforeAll(() => {
    // `input-otp` polls a PWM badge via document.elementFromPoint, which jsdom does not implement
    document.elementFromPoint = jest.fn(() => null);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isCaptchaEnabled).mockReturnValue(false);
  });

  describe('when verify-email reports the challenge is over (NOT_FOUND)', () => {
    it('sends the user back to the email step', async () => {
      jest.mocked(verifyEmail).mockResolvedValue({ error: { type: 'NOT_FOUND', message: 'Not found' } });
      const nextStep = jest.fn();
      renderVerifyStep(nextStep);

      await act(async () => {
        fireEvent.change(getOtpInput(), { target: { value: '023456' } });
      });

      await waitFor(() => expect(nextStep).toHaveBeenCalledWith(SignupSteps.EMAIL_INPUT));
      expect(nextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('when verify-email reports a wrong code (INVALID_OTP)', () => {
    it('keeps the user on the code step so they can retry', async () => {
      jest.mocked(verifyEmail).mockResolvedValue({ error: { type: 'INVALID_OTP', message: 'Invalid OTP' } });
      const nextStep = jest.fn();
      renderVerifyStep(nextStep);

      await act(async () => {
        fireEvent.change(getOtpInput(), { target: { value: '023456' } });
      });

      await waitFor(() => expect(verifyEmail).toHaveBeenCalled());
      expect(nextStep).not.toHaveBeenCalled();
    });
  });

  describe('when resend-otp reports the challenge is over (NOT_FOUND)', () => {
    it('sends the user back to the email step', async () => {
      jest.mocked(resendOTP).mockResolvedValue({ error: { type: 'NOT_FOUND', message: 'Not found' } });
      const nextStep = jest.fn();

      // Fake timers must be installed before render: the button records its start time on mount
      jest.useFakeTimers();
      try {
        renderVerifyStep(nextStep);

        // The resend button is rate limited client-side for 30s after mount
        act(() => {
          jest.advanceTimersByTime(31_000);
        });
        const resendButton = screen.getByRole('button', { name: /resend/i });
        expect(resendButton).not.toBeDisabled();
        fireEvent.click(resendButton);
      } finally {
        jest.useRealTimers();
      }

      await waitFor(() => expect(resendOTP).toHaveBeenCalledWith({ email: 'jane@example.com', sessionId: 'sess-1' }));
      await waitFor(() => expect(nextStep).toHaveBeenCalledWith(SignupSteps.EMAIL_INPUT));
    });
  });

  describe('when the email step is shown again after a dead challenge', () => {
    it('does not accept a leftover code in place of the captcha', async () => {
      // The form is shared by both steps and never remounts, so the code typed on the code step is
      // still in Formik state. The email step must not validate through it.
      jest.mocked(isCaptchaEnabled).mockReturnValue(true);
      jest.mocked(verifyEmail).mockResolvedValue({ error: { type: 'INVALID_OTP', message: 'Invalid OTP' } });
      jest.mocked(signup).mockResolvedValue({ success: true, sessionId: 'sess-1' });
      const nextStep = jest.fn();
      const { rerender } = render(
        withRequiredProviders(<EmailVerificationSteps step={SignupSteps.VERIFY_OTP} nextStep={nextStep} />),
      );

      await act(async () => {
        fireEvent.change(getOtpInput(), { target: { value: '023456' } });
      });
      rerender(withRequiredProviders(<EmailVerificationSteps step={SignupSteps.EMAIL_INPUT} nextStep={nextStep} />));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(signup).not.toHaveBeenCalled();
    });
  });
});
