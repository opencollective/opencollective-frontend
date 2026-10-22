import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { act, render, screen, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../../lib/constants/payment-methods';
import { confirmPayment } from '../../../lib/stripe/confirm-payment';
import { withRequiredProviders } from '../../../test/providers';

import ContributionFlow, { createOrderMutation } from '../index';
import { STRIPE_PAYMENT_ELEMENT_KEY } from '../utils';

const mockRouter = {
  query: {},
  push: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
  withRouter: Component => Component,
  default: {
    router: {
      push: (...args) => mockRouter.push(...args),
      replace: (...args) => mockRouter.replace(...args),
    },
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  },
}));

const mockLoggedInUserState = {
  LoggedInUser: null,
  loadingLoggedInUser: false,
  refetchLoggedInUser: jest.fn(() => Promise.resolve()),
};

jest.mock('../../../lib/hooks/useLoggedInUser', () => () => mockLoggedInUserState);

// ESM-only dependency of the guest profile form, not needed here
jest.mock('../../../lib/address', () => ({}));
jest.mock('../../../lib/stripe/confirm-payment', () => ({ confirmPayment: jest.fn() }));
jest.mock('../../../lib/stripe', () => ({ getStripe: jest.fn(), stripeTokenToPaymentMethod: jest.fn() }));

// Lets tests read the props given to the step and update the flow state through `onChange`, like real steps do
const mockStepContainer = { props: null };
jest.mock('../ContributionFlowStepContainer', () => props => {
  mockStepContainer.props = props;
  return <div data-testid="step-container" data-step={props.step.name} />;
});

const mockContributionFlowSuccess = jest.fn(() => <div data-testid="contribution-flow-success" />);
jest.mock('../ContributionFlowSuccess', () => ({
  __esModule: true,
  default: props => mockContributionFlowSuccess(props),
}));

jest.mock('../ContributionFlowHeader', () => () => <div data-testid="contribution-flow-header" />);
jest.mock('../ContributionFlowStepsProgress', () => () => null);
jest.mock('../ContributionSummary', () => () => null);
jest.mock('../../faqs/ContributeFAQ', () => () => <div data-testid="contribute-faq" />);

const host = { id: 'host-id', slug: 'host', settings: {} };

const collective = {
  id: 'collective-id',
  legacyId: 1,
  slug: 'test-collective',
  name: 'Test Collective',
  type: 'COLLECTIVE',
  currency: 'USD',
  settings: {},
  platformContributionAvailable: false,
  host,
};

const tier = {
  id: 'tier-id',
  legacyId: 12,
  slug: 'backer',
  name: 'Backer',
  type: 'TIER',
  amountType: 'FLEXIBLE',
  interval: null,
  amount: { valueInCents: 500, currency: 'USD' },
  minimumAmount: { valueInCents: 500 },
  presets: [500, 1000],
};

const loggedInUser = { id: 1, collective: { slug: 'user' } };
const userProfile = { account: { id: 'user-id', slug: 'user', name: 'User', type: 'INDIVIDUAL' } };
const guestQuery = { email: 'guest@example.com', name: 'Guest' };

const order = {
  __typename: 'Order',
  id: 'order-id',
  legacyId: 42,
  status: 'PAID',
  frequency: 'ONETIME',
  data: {},
  platformTipEligible: false,
  manualPaymentProvider: null,
  amount: { __typename: 'Amount', value: 10, valueInCents: 1000, currency: 'USD' },
  paymentMethod: null,
  platformTipAmount: { __typename: 'Amount', value: 0, valueInCents: 0, currency: 'USD' },
  tier: null,
  membership: null,
  fromAccount: {
    __typename: 'Individual',
    id: 'user-id',
    name: 'User',
    type: 'INDIVIDUAL',
    slug: 'user',
    imageUrl: null,
    isIncognito: false,
    isGuest: false,
  },
  toAccount: {
    __typename: 'Collective',
    id: 'collective-id',
    name: 'Test Collective',
    slug: 'test-collective',
    tags: [],
    type: 'COLLECTIVE',
    isHost: false,
    settings: {},
    socialLinks: [],
    stats: { __typename: 'AccountStats', id: 'stats-id', contributorsCount: 1 },
  },
};

const createOrderVariablesMatcher = jest.fn(() => true);
const createOrderMock = {
  request: { query: createOrderMutation },
  variableMatcher: createOrderVariablesMatcher,
  result: {
    data: {
      createOrder: { __typename: 'OrderWithPayment', guestToken: null, order, stripeError: null },
    },
  },
};

const stripeStepPayment = (key, type) => ({
  key,
  isCompleted: true,
  paymentMethod: {
    service: PAYMENT_METHOD_SERVICE.STRIPE,
    type,
    stripePaymentIntentId: 'pi_123',
    data: { stripePaymentMethodId: 'pm_123' },
  },
  stripeData: {
    stripe: { stripeAccount: 'acct_123' },
    paymentIntentClientSecret: 'pi_123_secret',
    elements: { id: 'stripe-elements' },
  },
});

const savedCardStepPayment = {
  key: 'pm-1',
  isCompleted: true,
  paymentMethod: { id: 'pm-1', service: PAYMENT_METHOD_SERVICE.STRIPE, type: PAYMENT_METHOD_TYPE.CREDITCARD },
};

const renderContributionFlow = (props = {}) => {
  const buildUI = currentProps =>
    withRequiredProviders(
      <MockedProvider mocks={[createOrderMock]}>
        <ContributionFlow collective={collective} host={host} tier={null} contributorProfiles={[]} {...currentProps} />
      </MockedProvider>,
    );

  const result = render(buildUI(props));
  return { ...result, rerenderFlow: (newProps = {}) => result.rerender(buildUI({ ...props, ...newProps })) };
};

const setRouterQuery = query => {
  mockRouter.query = query;
};

const getNextButton = () => document.querySelector('[data-cy="cf-next-step"]');
const getBackButton = () => document.querySelector('[data-cy="cf-prev-step"]');

const waitForStep = async stepName => {
  await waitFor(() => expect(screen.getByTestId('step-container')).toHaveAttribute('data-step', stepName));
};

// Buttons are disabled until the initial URL sync is done
const waitForReady = async () => {
  await waitFor(() => expect(getNextButton()).toBeEnabled());
};

const updateFlowState = async data => {
  await act(async () => {
    mockStepContainer.props.onChange(data);
  });
};

const getPushedPathnames = () => mockRouter.push.mock.calls.map(([route]) => route.pathname);

/**
 * Starting the flow on a later step forces the summary step, so tests mount on the details step
 * then navigate to the payment step, like a contributor going through the flow would.
 */
const renderOnPaymentStep = async (props = {}, query = {}) => {
  setRouterQuery(query);
  const result = renderContributionFlow(props);
  await waitForReady();
  setRouterQuery({ ...query, step: 'payment' });
  result.rerenderFlow();
  await waitForStep('payment');
  return result;
};

const submitContribution = async () => {
  await waitForReady();
  await act(async () => {
    getNextButton().click();
  });
};

describe('ContributionFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.query = {};
    mockStepContainer.props = null;
    mockLoggedInUserState.LoggedInUser = null;
    mockLoggedInUserState.loadingLoggedInUser = false;
  });

  describe('step routes', () => {
    // Opening the payment step as an incomplete guest sends the contributor back to the profile step
    const expectRedirectToProfile = async (props, query, expectedPathname) => {
      setRouterQuery({ ...query, step: 'payment' });
      renderContributionFlow(props);
      await waitFor(() => expect(getPushedPathnames()).toContain(expectedPathname));
    };

    it('uses the donate route without a tier', async () => {
      await expectRedirectToProfile({}, {}, '/test-collective/donate/profile');
    });

    it.each(['contribute', 'new-contribute'])('uses the donate route for the "%s" verb without a tier', async verb => {
      await expectRedirectToProfile({}, { verb }, '/test-collective/donate/profile');
    });

    it('uses the tier checkout route with a tier', async () => {
      await expectRedirectToProfile(
        { tier },
        { verb: 'donate' },
        '/test-collective/contribute/backer-12/checkout/profile',
      );
    });

    it('uses the order route for tickets of accounts with a parent', async () => {
      const event = { ...collective, slug: 'test-event', type: 'EVENT', parent: { slug: 'parent-collective' } };
      const ticket = { ...tier, slug: 'ticket', type: 'TICKET', amountType: 'FIXED' };
      await expectRedirectToProfile(
        { collective: event, tier: ticket },
        {},
        '/parent-collective/events/test-event/order/12/profile',
      );
    });

    it('uses the embed donate route in embeds', async () => {
      await expectRedirectToProfile({ isEmbed: true }, {}, '/embed/test-collective/donate/profile');
    });

    it('uses the embed tier route in embeds with a tier', async () => {
      await expectRedirectToProfile({ isEmbed: true, tier }, {}, '/embed/test-collective/contribute/backer-12/profile');
    });

    it('notifies the step change', async () => {
      const onStepChange = jest.fn();
      setRouterQuery({ step: 'payment' });
      renderContributionFlow({ onStepChange });
      await waitFor(() => expect(onStepChange).toHaveBeenCalledWith('profile'));
    });
  });

  it('syncs the URL with the initial state on mount, with a shallow replace', async () => {
    setRouterQuery(guestQuery);
    renderContributionFlow();

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    const [route, as, options] = mockRouter.replace.mock.calls[0];
    expect(route.pathname).toBe('/test-collective/donate');
    expect(route.query).toMatchObject({ ...guestQuery, interval: 'oneTime' });
    expect(as).toBeNull();
    expect(options).toEqual({ scroll: false, shallow: true });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('renders the success step with isEmbed', async () => {
    setRouterQuery({ step: 'success', OrderId: 'order-id' });
    renderContributionFlow({ isEmbed: true });

    expect(await screen.findByTestId('contribution-flow-success')).toBeInTheDocument();
    expect(mockContributionFlowSuccess).toHaveBeenCalledWith({ collective, isEmbed: true });
    expect(getNextButton()).toBeNull();
  });

  describe('Stripe redirect payment methods', () => {
    beforeEach(() => {
      mockLoggedInUserState.LoggedInUser = loggedInUser;
    });

    it.each([
      ['the Payment Element', STRIPE_PAYMENT_ELEMENT_KEY, PAYMENT_METHOD_TYPE.PAYMENT_INTENT],
      ['SEPA debits', 'sepa', PAYMENT_METHOD_TYPE.SEPA_DEBIT],
      ['US bank accounts', 'us-bank', PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT],
    ])('confirms %s with a return URL on the success step', async (_, key, type) => {
      confirmPayment.mockResolvedValue(undefined);
      const stepPayment = stripeStepPayment(key, type);
      await renderOnPaymentStep({ contributorProfiles: [userProfile] });
      await updateFlowState({ stepPayment });
      await submitContribution();

      await waitFor(() => expect(confirmPayment).toHaveBeenCalledTimes(1));
      const [stripe, clientSecret, paymentData] = confirmPayment.mock.calls[0];
      expect(stripe).toBe(stepPayment.stripeData.stripe);
      expect(clientSecret).toBe('pi_123_secret');
      expect(paymentData).toMatchObject({ elements: stepPayment.stripeData.elements, type, paymentMethodId: 'pm_123' });

      const returnUrl = new URL(paymentData.returnUrl);
      expect(returnUrl.pathname).toBe('/test-collective/donate/success');
      expect(Object.fromEntries(returnUrl.searchParams)).toEqual({ OrderId: 'order-id', stripeAccount: 'acct_123' });

      // Then goes to the success step
      await waitFor(() => expect(getPushedPathnames()).toContain('/test-collective/donate/success'));
    });

    it('keeps the embed display options and the redirect on the return URL in embeds', async () => {
      confirmPayment.mockResolvedValue(undefined);
      const query = {
        useTheme: 'true',
        backgroundColor: '#ff0000',
        hideSteps: 'true',
        hideFAQ: 'true',
        hideHeader: 'true',
        redirect: 'https://example.com/thanks',
        shouldRedirectParent: 'true',
      };

      await renderOnPaymentStep({ isEmbed: true, contributorProfiles: [userProfile] }, query);
      await updateFlowState({
        stepPayment: stripeStepPayment(STRIPE_PAYMENT_ELEMENT_KEY, PAYMENT_METHOD_TYPE.PAYMENT_INTENT),
      });
      await submitContribution();

      await waitFor(() => expect(confirmPayment).toHaveBeenCalledTimes(1));
      expect(createOrderVariablesMatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({ context: expect.objectContaining({ isEmbed: true }) }),
        }),
      );

      const returnUrl = new URL(confirmPayment.mock.calls[0][2].returnUrl);
      expect(returnUrl.pathname).toBe('/embed/test-collective/donate/success');
      expect(Object.fromEntries(returnUrl.searchParams)).toEqual({
        OrderId: 'order-id',
        stripeAccount: 'acct_123',
        useTheme: 'true',
        backgroundColor: '#f00', // Normalized by the URL query helper
        hideSteps: 'true',
        hideFAQ: 'true',
        hideHeader: 'true',
        redirect: 'https://example.com/thanks',
        shouldRedirectParent: 'true',
      });
    });

    it('shows the error and stays on the payment step when the payment confirmation fails', async () => {
      confirmPayment.mockRejectedValue(new Error('Your card was declined.'));
      await renderOnPaymentStep({ contributorProfiles: [userProfile] });
      await updateFlowState({
        stepPayment: stripeStepPayment(STRIPE_PAYMENT_ELEMENT_KEY, PAYMENT_METHOD_TYPE.PAYMENT_INTENT),
      });
      await submitContribution();

      expect(await screen.findByText('Your card was declined.')).toBeInTheDocument();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(screen.getByTestId('step-container')).toHaveAttribute('data-step', 'payment');
    });
  });

  describe('on success', () => {
    it('goes to the success step with the order ID and the guest email', async () => {
      const onSuccess = jest.fn();
      await renderOnPaymentStep({ onSuccess }, guestQuery);
      await updateFlowState({ stepPayment: savedCardStepPayment });
      await submitContribution();

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-id' })));
      expect(mockRouter.push).toHaveBeenCalledWith(
        { pathname: '/test-collective/donate/success', query: { OrderId: 'order-id', email: 'guest@example.com' } },
        null,
        { shallow: true },
      );
      expect(mockLoggedInUserState.refetchLoggedInUser).toHaveBeenCalled();
    });

    it('follows a valid external redirect instead of going to the success step', async () => {
      await renderOnPaymentStep({}, { ...guestQuery, redirect: 'https://example.com/thanks' });
      await updateFlowState({ stepPayment: savedCardStepPayment });
      await submitContribution();

      await waitFor(() => expect(getPushedPathnames()).toContain('/external-redirect'));
      const [{ query }] = mockRouter.push.mock.calls.find(([route]) => route.pathname === '/external-redirect');
      const redirectUrl = new URL(query.url);
      expect(redirectUrl.origin).toBe('https://example.com');
      expect(redirectUrl.searchParams.get('orderIdV2')).toBe('order-id');
      expect(getPushedPathnames()).not.toContain('/test-collective/donate/success');
    });
  });

  describe('when the logged in user changes', () => {
    it('goes back to the profile step on logout', async () => {
      mockLoggedInUserState.LoggedInUser = loggedInUser;
      const { rerenderFlow } = await renderOnPaymentStep({ contributorProfiles: [userProfile] });
      mockRouter.push.mockClear();

      mockLoggedInUserState.LoggedInUser = null;
      rerenderFlow({ contributorProfiles: [] });

      await waitFor(() => expect(getPushedPathnames()).toEqual(['/test-collective/donate/profile']));
    });

    it('sends guests back to the profile step when logging in with another email', async () => {
      const { rerenderFlow } = await renderOnPaymentStep({}, guestQuery);
      mockRouter.push.mockClear();

      mockLoggedInUserState.LoggedInUser = loggedInUser;
      rerenderFlow({ contributorProfiles: [userProfile] });

      await waitFor(() => expect(getPushedPathnames()).toEqual(['/test-collective/donate/profile']));
    });

    it.each(['details', 'profile'])('keeps guests on the %s step when logging in with another email', async step => {
      setRouterQuery({ ...guestQuery, step });
      const { rerenderFlow } = renderContributionFlow();
      await waitForStep(step);
      await waitForReady();
      mockRouter.push.mockClear();

      mockLoggedInUserState.LoggedInUser = loggedInUser;
      rerenderFlow({ contributorProfiles: [userProfile] });

      // The step profile is replaced by the logged in user profile...
      await waitFor(() => expect(mockStepContainer.props.mainState.stepProfile).toBe(userProfile.account));
      // ...without leaving the current step
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(screen.getByTestId('step-container')).toHaveAttribute('data-step', step);
    });
  });

  describe('display options', () => {
    it('shows the back button on the payment step', async () => {
      mockLoggedInUserState.LoggedInUser = loggedInUser;
      await renderOnPaymentStep({ contributorProfiles: [userProfile] });
      expect(getBackButton()).toBeInTheDocument();
    });

    it('hides the back button on the payment step with hideSteps', async () => {
      mockLoggedInUserState.LoggedInUser = loggedInUser;
      await renderOnPaymentStep({ contributorProfiles: [userProfile] }, { hideSteps: 'true' });
      expect(getBackButton()).not.toBeInTheDocument();
    });

    it('shows the header and the FAQ by default in embeds', async () => {
      renderContributionFlow({ isEmbed: true });
      await waitForReady();
      expect(screen.getByTestId('contribution-flow-header')).toBeInTheDocument();
      expect(screen.getByTestId('contribute-faq')).toBeInTheDocument();
    });

    it('hides the header and the FAQ in embeds with hideHeader and hideFAQ', async () => {
      setRouterQuery({ hideHeader: 'true', hideFAQ: 'true' });
      renderContributionFlow({ isEmbed: true });
      await waitForReady();
      expect(screen.queryByTestId('contribution-flow-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('contribute-faq')).not.toBeInTheDocument();
    });
  });
});
