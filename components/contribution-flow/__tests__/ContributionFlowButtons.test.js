import React from 'react';
import { act, configure, fireEvent, render, screen } from '@testing-library/react';

import { AnalyticsEvent } from '../../../lib/analytics/events';
import { track } from '../../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../../lib/analytics/properties';
import { withRequiredProviders } from '../../../test/providers';

import ContributionFlowButtons from '../ContributionFlowButtons';

// Buttons are identified by their `data-cy` attribute
configure({ testIdAttribute: 'data-cy' });

jest.mock('../../../lib/analytics/plausible', () => ({ track: jest.fn() }));
jest.mock('../../PayWithPaypalButton', () => ({ isSubmitting }) => (
  <div data-cy="paypal-button" data-submitting={String(isSubmitting)} />
));

const STEP_DETAILS = { name: 'details' };
const STEP_PROFILE = { name: 'profile' };
const STEP_PAYMENT = { name: 'payment' };
// `Steps` doesn't provide `goBack` on the first step
const FIRST_STEP_PROPS = { step: STEP_DETAILS, prevStep: null, goBack: undefined };

const renderButtons = props =>
  render(
    withRequiredProviders(
      <ContributionFlowButtons
        goNext={jest.fn()}
        goBack={jest.fn()}
        step={STEP_PROFILE}
        prevStep={STEP_DETAILS}
        nextStep={STEP_PAYMENT}
        isValidating={false}
        paypalButtonProps={null}
        currency="USD"
        disabled={false}
        tier={null}
        stepDetails={{ amount: 1000, quantity: 1, platformTip: 0 }}
        stepSummary={null}
        showPlatformTip
        hostSlug="opensource"
        {...props}
      />,
    ),
  );

const createDeferred = () => {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('ContributionFlowButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('next button', () => {
    it('tracks the details step completion before calling goNext', async () => {
      const calls = [];
      track.mockImplementation(event => calls.push(`track:${event}`));
      const goNext = jest.fn(() => calls.push('goNext'));
      renderButtons({
        ...FIRST_STEP_PROPS,
        nextStep: STEP_PROFILE,
        goNext,
        stepDetails: { amount: 1000, quantity: 1, isNewPlatformTip: true },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('cf-next-step'));
      });

      expect(calls).toEqual([`track:${AnalyticsEvent.CONTRIBUTION_DETAILS_STEP_COMPLETED}`, 'goNext']);
      expect(track).toHaveBeenCalledWith(AnalyticsEvent.CONTRIBUTION_DETAILS_STEP_COMPLETED, {
        props: expect.objectContaining({
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: 'new',
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: true,
          [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: 'opensource',
        }),
      });
    });

    it('does not track on steps other than details', async () => {
      const goNext = jest.fn();
      renderButtons({ step: STEP_PROFILE, goNext });

      await act(async () => {
        fireEvent.click(screen.getByTestId('cf-next-step'));
      });

      expect(goNext).toHaveBeenCalledTimes(1);
      expect(track).not.toHaveBeenCalled();
    });

    it('shows a loading state while goNext is pending, and resets it once resolved', async () => {
      const deferred = createDeferred();
      renderButtons({ goNext: jest.fn(() => deferred.promise) });

      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Payment');
      await act(async () => {
        fireEvent.click(screen.getByTestId('cf-next-step'));
      });
      expect(screen.getByTestId('cf-next-step')).not.toHaveTextContent('Payment');

      await act(async () => {
        deferred.resolve();
      });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Payment');
    });

    it('shows a loading state while validating', () => {
      renderButtons({ isValidating: true });
      expect(screen.getByTestId('cf-next-step')).not.toHaveTextContent('Payment');
    });

    it('is disabled when the flow is disabled', () => {
      renderButtons({ disabled: true });
      expect(screen.getByTestId('cf-next-step')).toBeDisabled();
      expect(screen.getByTestId('cf-prev-step')).toBeDisabled();
    });
  });

  describe('labels', () => {
    it('shows the next step label', () => {
      renderButtons({ ...FIRST_STEP_PROPS, nextStep: STEP_PROFILE });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Your info →');
    });

    it('falls back to "Next step" for steps without a label', () => {
      renderButtons({ nextStep: { name: 'summary' } });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Next step →');
    });

    it('shows "Get tickets" on the last step of a ticket tier', () => {
      renderButtons({ nextStep: null, tier: { type: 'TICKET' }, stepDetails: { amount: 1000, quantity: 2 } });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Get tickets');
    });

    it('shows "Get ticket" for a single ticket', () => {
      renderButtons({ nextStep: null, tier: { type: 'TICKET' }, stepDetails: { amount: 1000, quantity: 1 } });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Get ticket');
      expect(screen.getByTestId('cf-next-step')).not.toHaveTextContent('Get tickets');
    });

    it('shows the total amount, including platform tip and taxes, on the last step', () => {
      renderButtons({
        nextStep: null,
        stepDetails: { amount: 1000, quantity: 2, platformTip: 300 },
        stepSummary: { amount: 200 },
      });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Contribute $25');
    });

    it('shows "Make contribution" on the last step when the total is zero', () => {
      renderButtons({ nextStep: null, stepDetails: { amount: 0, quantity: 1 } });
      expect(screen.getByTestId('cf-next-step')).toHaveTextContent('Make contribution');
    });
  });

  describe('back button', () => {
    it('shows the previous step label and calls goBack', () => {
      const goBack = jest.fn();
      renderButtons({ goBack, prevStep: STEP_DETAILS });
      const button = screen.getByTestId('cf-prev-step');
      expect(button).toHaveTextContent('← Contribution');
      fireEvent.click(button);
      expect(goBack).toHaveBeenCalledTimes(1);
    });

    it('falls back to "Previous" for steps without a label', () => {
      renderButtons({ prevStep: { name: 'summary' } });
      expect(screen.getByTestId('cf-prev-step')).toHaveTextContent('← Previous');
    });

    it('is hidden when goBack is not provided', () => {
      renderButtons({ goBack: null });
      expect(screen.queryByTestId('cf-prev-step')).not.toBeInTheDocument();
    });
  });

  describe('PayPal', () => {
    it('replaces the submit button with the PayPal button on the last step', () => {
      renderButtons({ nextStep: null, paypalButtonProps: { currency: 'USD' }, isValidating: true });
      expect(screen.queryByTestId('cf-next-step')).not.toBeInTheDocument();
      expect(screen.getByTestId('paypal-button')).toHaveAttribute('data-submitting', 'true');
    });

    it('keeps the next button when there is a next step', () => {
      renderButtons({ nextStep: STEP_PAYMENT, paypalButtonProps: { currency: 'USD' } });
      expect(screen.getByTestId('cf-next-step')).toBeInTheDocument();
      expect(screen.queryByTestId('paypal-button')).not.toBeInTheDocument();
    });
  });
});
