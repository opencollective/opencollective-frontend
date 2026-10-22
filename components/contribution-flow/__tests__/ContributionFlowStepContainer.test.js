import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import ContributionFlowStepContainer from '../ContributionFlowStepContainer';

let mockLoggedInUser = null;
jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({ LoggedInUser: mockLoggedInUser }));

// Steps are tested on their own, only check which one gets rendered
jest.mock('../StepDetails', () => () => <div data-testid="step-details" />);
jest.mock('../StepProfile', () => () => <div data-testid="step-profile" />);
jest.mock('../StepPayment', () => () => <div data-testid="step-payment" />);
jest.mock('../StepSummary', () => {
  const React = require('react');
  const MockStepSummary = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ validate: () => 'validated-by-step-summary' }));
    return <div data-testid="step-summary" />;
  });
  MockStepSummary.displayName = 'MockStepSummary';
  return MockStepSummary;
});

// Platform tip containers report a new option/value when clicked
jest.mock('../PlatformTipContainer', () => ({
  PlatformTipContainer: ({ onChange }) => (
    <button type="button" data-testid="platform-tip" onClick={() => onChange('OTHER', 500)} />
  ),
}));
jest.mock('../NewPlatformTipContainer', () => ({
  NewPlatformTipContainer: ({ onChange }) => (
    <button type="button" data-testid="new-platform-tip" onClick={() => onChange('OTHER', 700)} />
  ),
}));

const collective = { id: 'collective-id', slug: 'webpack', name: 'Webpack', currency: 'USD', settings: {} };
const stepDetails = { amount: 1000, quantity: 2, platformTip: 300, platformTipOption: 'FIFTEEN_PERCENT' };

const renderStepContainer = (props = {}) => {
  const onChange = jest.fn();
  const result = render(
    withRequiredProviders(
      <ContributionFlowStepContainer
        collective={collective}
        contributorProfiles={[]}
        tier={null}
        onChange={onChange}
        showPlatformTip={false}
        onNewCardFormReady={jest.fn()}
        onSignInClick={jest.fn()}
        isEmbed={false}
        disabledPaymentMethodTypes={undefined}
        isSubmitting={false}
        hideCreditCardPostalCode={false}
        taxes={[]}
        step={{ name: 'details' }}
        mainState={{ stepProfile: {}, stepDetails, stepSummary: null, stepPayment: null }}
        stepSummaryRef={undefined}
        {...props}
      />,
    ),
  );

  return { ...result, onChange };
};

describe('ContributionFlowStepContainer', () => {
  beforeEach(() => {
    mockLoggedInUser = null;
  });

  describe('header and step', () => {
    it.each([
      ['details', 'Contribution details', 'step-details'],
      ['payment', 'Choose payment method', 'step-payment'],
      ['summary', 'Summary', 'step-summary'],
    ])('renders the %s step', (stepName, header, testId) => {
      renderStepContainer({ step: { name: stepName } });
      expect(screen.getByRole('heading', { name: header })).toBeInTheDocument();
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    it('renders the profile step as a guest when logged out', () => {
      renderStepContainer({ step: { name: 'profile' } });
      expect(screen.getByRole('heading', { name: 'Contribute as a guest' })).toBeInTheDocument();
      expect(screen.getByTestId('step-profile')).toBeInTheDocument();
    });

    it('renders the profile step for logged in users', () => {
      mockLoggedInUser = { id: 1 };
      renderStepContainer({ step: { name: 'profile' } });
      expect(screen.getByRole('heading', { name: 'Contribute as' })).toBeInTheDocument();
    });

    it('tells blocked contributors that they cannot contribute on the payment step', () => {
      renderStepContainer({
        step: { name: 'payment' },
        mainState: {
          stepProfile: { contributorRejectedCategories: ['CASINO_GAMBLING'] },
          stepDetails,
          stepSummary: null,
          stepPayment: null,
        },
      });
      expect(screen.getByRole('heading', { name: 'Unable to contribute' })).toBeInTheDocument();
    });

    it('falls back to the step name for unknown steps', () => {
      renderStepContainer({ step: { name: 'custom' } });
      expect(screen.getByRole('heading', { name: 'custom' })).toBeInTheDocument();
    });

    it('shows the share button', () => {
      renderStepContainer();
      expect(screen.getByRole('button', { name: 'Share link' })).toBeInTheDocument();
    });

    it('hides the share button in embeds', () => {
      renderStepContainer({ isEmbed: true });
      expect(screen.queryByRole('button', { name: 'Share link' })).not.toBeInTheDocument();
    });
  });

  it('forwards stepSummaryRef to the summary step', () => {
    const stepSummaryRef = React.createRef();
    renderStepContainer({ step: { name: 'summary' }, stepSummaryRef });
    expect(stepSummaryRef.current.validate()).toBe('validated-by-step-summary');
  });

  describe('platform tip', () => {
    it('is hidden when platform tips are not available', () => {
      renderStepContainer({ showPlatformTip: false });
      expect(screen.queryByTestId('platform-tip')).not.toBeInTheDocument();
      expect(screen.queryByTestId('new-platform-tip')).not.toBeInTheDocument();
    });

    it('uses the legacy container and merges the selected tip into stepDetails', () => {
      const { onChange } = renderStepContainer({ showPlatformTip: true });
      expect(screen.queryByTestId('new-platform-tip')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('platform-tip'));
      expect(onChange).toHaveBeenCalledWith({
        stepDetails: { ...stepDetails, platformTip: 500, platformTipOption: 'OTHER' },
      });
    });

    it('uses the new container when the new platform tip flow is enabled', () => {
      const newFlowStepDetails = { ...stepDetails, isNewPlatformTip: true };
      const { onChange } = renderStepContainer({
        showPlatformTip: true,
        mainState: { stepProfile: {}, stepDetails: newFlowStepDetails, stepSummary: null, stepPayment: null },
      });
      expect(screen.queryByTestId('platform-tip')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('new-platform-tip'));
      expect(onChange).toHaveBeenCalledWith({
        stepDetails: { ...newFlowStepDetails, platformTip: 700, platformTipOption: 'OTHER' },
      });
    });
  });
});
