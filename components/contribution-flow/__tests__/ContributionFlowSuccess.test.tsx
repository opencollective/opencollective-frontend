import '@testing-library/jest-dom';

import React from 'react';
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

import { AnalyticsEvent } from '../../../lib/analytics/events';
import { track } from '../../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../../lib/analytics/properties';
import { getStripe } from '../../../lib/stripe';
import { withRequiredProviders } from '../../../test/providers';

import ContributionFlowSuccess, { orderSuccessQuery } from '../ContributionFlowSuccess';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockRouter;

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
  withRouter: Component => Component,
  default: {
    router: {
      push: (...args: unknown[]) => mockPush(...args),
      replace: (...args: unknown[]) => mockReplace(...args),
    },
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  },
}));

const mockRetrievePaymentIntent = jest.fn();
jest.mock('../../../lib/stripe', () => ({
  getStripe: jest.fn(() => Promise.resolve({ retrievePaymentIntent: mockRetrievePaymentIntent })),
}));

jest.mock('../../../lib/analytics/plausible', () => ({ track: jest.fn() }));

jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({
  LoggedInUser: null,
  loadingLoggedInUser: false,
}));

// The order fragment spreads on interfaces, which the cache can only match with `possibleTypes`
const createCache = () =>
  new InMemoryCache({
    possibleTypes: {
      Account: ['Collective', 'Event', 'Project', 'Individual', 'Organization'],
      AccountWithHost: ['Collective', 'Event', 'Project'],
      AccountWithParent: ['Event', 'Project'],
    },
  });

const buildOrder = (overrides = {}) => ({
  __typename: 'Order',
  id: 'order-id',
  legacyId: 123,
  status: 'PAID',
  frequency: 'ONETIME',
  data: {},
  platformTipEligible: true,
  manualPaymentProvider: null,
  amount: { __typename: 'Amount', value: 10, valueInCents: 1000, currency: 'USD' },
  paymentMethod: { __typename: 'PaymentMethod', id: 'pm-id', service: 'STRIPE', type: 'CREDITCARD', data: {} },
  platformTipAmount: { __typename: 'Amount', value: 0, valueInCents: 0, currency: 'USD' },
  tier: null,
  membership: null,
  fromAccount: {
    __typename: 'Individual',
    id: 'user-id',
    name: 'User',
    type: 'INDIVIDUAL',
    slug: 'user-slug',
    imageUrl: null,
    isIncognito: false,
    isGuest: false,
  },
  toAccount: {
    __typename: 'Collective',
    id: 'collective-id',
    name: 'Collective',
    slug: 'collective-slug',
    tags: [],
    type: 'COLLECTIVE',
    isHost: false,
    settings: {},
    socialLinks: [],
    stats: { __typename: 'AccountStats', id: 'stats-id', contributorsCount: 1 },
    host: { __typename: 'Host', id: 'host-id', slug: 'host-slug', settings: {} },
  },
  ...overrides,
});

// Query params Stripe adds when redirecting back after a redirect-based payment
// eslint-disable-next-line camelcase
const stripeReturnQuery = { payment_intent_client_secret: 'pi_secret_123' };

const buildOrderMock = (order, orderId = 'order-id') => ({
  request: { query: orderSuccessQuery, variables: { order: { id: orderId } } },
  result: { data: { order } },
});

const renderSuccess = ({
  query = {},
  order = buildOrder(),
  isEmbed = false,
}: {
  query?: Record<string, string | string[]>;
  order?: ReturnType<typeof buildOrder> | null;
  isEmbed?: boolean;
} = {}) => {
  mockRouter = { isReady: true, query: { OrderId: 'order-id', ...query }, push: mockPush, replace: mockReplace };
  const collective = { id: 1, slug: 'collective-slug', name: 'Collective' };
  const renderUI = () =>
    withRequiredProviders(
      <MockedProvider mocks={[buildOrderMock(order)]} cache={createCache()}>
        <ContributionFlowSuccess collective={collective} isEmbed={isEmbed} />
      </MockedProvider>,
    );

  const result = render(renderUI());
  return {
    ...result,
    // Re-render with a new router reference, as happens during navigation
    rerenderWithNewRouter: () => {
      mockRouter = { ...mockRouter };
      result.rerender(renderUI());
    },
  };
};

describe('ContributionFlowSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('order loading', () => {
    it('shows the success view for the order in the URL', async () => {
      renderSuccess();

      expect(await screen.findByText('Thank you! 🎉')).toBeInTheDocument();
      expect(screen.getByText('Collective', { selector: 'a' })).toHaveAttribute('href', '/collective-slug');
      expect(document.querySelector('[data-cy="contribution-id-123"]')).toBeInTheDocument();
    });

    it('only uses the first OrderId when the param is repeated', async () => {
      renderSuccess({ query: { OrderId: ['order-id', 'other-order-id'] } });

      expect(await screen.findByText('Thank you! 🎉')).toBeInTheDocument();
    });

    it('shows a not found message when the order does not exist', async () => {
      renderSuccess({ order: null });

      expect(await screen.findByText("This contribution doesn't exist")).toBeInTheDocument();
    });

    it('shows a not found message without querying when there is no OrderId', async () => {
      mockRouter = { isReady: true, query: {}, push: mockPush, replace: mockReplace };
      const queryResult = jest.fn(() => ({ data: { order: buildOrder() } }));
      render(
        withRequiredProviders(
          <MockedProvider
            mocks={[{ request: { query: orderSuccessQuery }, variableMatcher: () => true, result: queryResult }]}
            cache={createCache()}
          >
            <ContributionFlowSuccess collective={{ slug: 'collective-slug' }} isEmbed={false} />
          </MockedProvider>,
        ),
      );

      expect(await screen.findByText("This contribution doesn't exist")).toBeInTheDocument();
      expect(queryResult).not.toHaveBeenCalled();
    });

    it('tracks the contribution success once', async () => {
      const { rerenderWithNewRouter } = renderSuccess();

      await screen.findByText('Thank you! 🎉');
      rerenderWithNewRouter();

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith(AnalyticsEvent.CONTRIBUTION_SUCCESS, {
        props: {
          [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: 'host-slug',
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: true,
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: 'old',
        },
      });
    });
  });

  describe('order status', () => {
    it('shows the payment instructions for pending manual contributions', async () => {
      renderSuccess({
        order: buildOrder({
          status: 'PENDING',
          paymentMethod: null,
          manualPaymentProvider: {
            __typename: 'ManualPaymentProvider',
            id: 'mpp-id',
            type: 'BANK_TRANSFER',
            name: 'Bank transfer',
            instructions: '<p>Send the money to our bank account</p>',
            icon: null,
            accountDetails: {},
          },
        }),
      });

      expect(await screen.findByText('Contribution request received')).toBeInTheDocument();
      expect(screen.getByText('Payment instructions')).toBeInTheDocument();
      expect(screen.getByText('Bank transfer')).toBeInTheDocument();
      expect(screen.queryByText('Thank you! 🎉')).not.toBeInTheDocument();
    });

    it('shows the processing banner for processing contributions', async () => {
      renderSuccess({ order: buildOrder({ status: 'PROCESSING' }) });

      expect(await screen.findByText('Your Contribution is processing!')).toBeInTheDocument();
      expect(screen.getByText('View Contribution!')).toHaveAttribute('href', '/user-slug/transactions');
    });

    it('does not show the processing banner in embeds', async () => {
      renderSuccess({ order: buildOrder({ status: 'PROCESSING' }), isEmbed: true });

      await screen.findByText('Thank you! 🎉');
      expect(screen.queryByText('Your Contribution is processing!')).not.toBeInTheDocument();
    });
  });

  describe('embed', () => {
    it('does not link out of the embed', async () => {
      renderSuccess({ isEmbed: true });

      await screen.findByText('Thank you! 🎉');
      expect(screen.queryByText('Collective', { selector: 'a' })).not.toBeInTheDocument();
      expect(screen.queryByText(/Discover more Collectives/)).not.toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  describe('stripe payment intent', () => {
    it('checks the payment intent with the connected stripe account', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });

      renderSuccess({ query: { ...stripeReturnQuery, stripeAccount: 'acct_123' } });

      expect(await screen.findByText('Thank you! 🎉')).toBeInTheDocument();
      expect(getStripe).toHaveBeenCalledWith(null, 'acct_123');
      expect(mockRetrievePaymentIntent).toHaveBeenCalledWith('pi_secret_123');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('shows the success view while the payment is processing', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ paymentIntent: { status: 'processing' } });

      renderSuccess({ query: stripeReturnQuery });

      expect(await screen.findByText('Thank you! 🎉')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('redirects to the payment step once on stripe error, even when the router reference changes', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ error: { message: 'Your card was declined.' } });

      const { rerenderWithNewRouter } = renderSuccess({ query: stripeReturnQuery });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      const redirectUrl = new URL(mockReplace.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/collective-slug/donate/payment');
      expect(Object.fromEntries(redirectUrl.searchParams)).toEqual({
        error: 'Your card was declined.',
        interval: 'oneTime',
        amount: '10',
        contributeAs: 'user-slug',
      });

      rerenderWithNewRouter();

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('redirects to the tier payment step with the last payment error', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({
        paymentIntent: {
          status: 'requires_payment_method',
          last_payment_error: { message: 'Insufficient funds.' }, // eslint-disable-line camelcase
        },
      });

      renderSuccess({
        query: stripeReturnQuery,
        order: buildOrder({
          frequency: 'MONTHLY',
          tier: { __typename: 'Tier', id: 'tier-id', legacyId: 42, name: 'Backer', slug: 'backer' },
        }),
      });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      const redirectUrl = new URL(mockReplace.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/collective-slug/contribute/backer-42/checkout/payment');
      expect(redirectUrl.searchParams.get('error')).toBe('Insufficient funds.');
      expect(redirectUrl.searchParams.get('interval')).toBe('month');
    });

    it('falls back to a generic error when stripe gives no payment error', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ paymentIntent: { status: 'canceled' } });

      renderSuccess({ query: stripeReturnQuery });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      expect(new URL(mockReplace.mock.calls[0][0]).searchParams.get('error')).toBe('An unknown error has occurred');
    });

    it('keeps the redirect params when sending a failed payment back to the payment step', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ error: { message: 'Your card was declined.' } });

      renderSuccess({
        query: {
          ...stripeReturnQuery,
          redirect: 'https://example.com/test',
          shouldRedirectParent: 'true',
        },
      });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      const redirectUrl = new URL(mockReplace.mock.calls[0][0]);
      expect(redirectUrl.searchParams.get('redirect')).toBe('https://example.com/test');
      expect(redirectUrl.searchParams.get('shouldRedirectParent')).toBe('true');
      // A failed payment must never be sent to the external redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('keeps embedded contributions on the embed route when the stripe payment fails', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ error: { message: 'Your card was declined.' } });

      renderSuccess({
        isEmbed: true,
        query: {
          ...stripeReturnQuery,
          useTheme: 'true',
          backgroundColor: '#ff0000',
          hideSteps: 'true',
        },
      });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      const redirectUrl = new URL(mockReplace.mock.calls[0][0]);
      expect(redirectUrl.pathname).toBe('/embed/collective-slug/donate/payment');
      expect(redirectUrl.searchParams.get('error')).toBe('Your card was declined.');
      expect(redirectUrl.searchParams.get('useTheme')).toBe('true');
      expect(redirectUrl.searchParams.get('backgroundColor')).toBe('#ff0000');
      expect(redirectUrl.searchParams.get('hideSteps')).toBe('true');
    });

    it('keeps embedded tier contributions on the embed tier route when the stripe payment fails', async () => {
      mockRetrievePaymentIntent.mockResolvedValue({ error: { message: 'Your card was declined.' } });

      renderSuccess({
        isEmbed: true,
        query: stripeReturnQuery,
        order: buildOrder({
          tier: { __typename: 'Tier', id: 'tier-id', legacyId: 42, name: 'Backer', slug: 'backer' },
        }),
      });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      expect(new URL(mockReplace.mock.calls[0][0]).pathname).toBe(
        '/embed/collective-slug/contribute/backer-42/payment',
      );
    });

    it('shows the success view when the payment intent lookup fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRetrievePaymentIntent.mockRejectedValue(new Error('Network error'));

      renderSuccess({ query: stripeReturnQuery });

      expect(await screen.findByText('Thank you! 🎉')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('external redirect', () => {
    it('follows the external redirect only once, even when the router reference changes', async () => {
      const { rerenderWithNewRouter } = renderSuccess({ query: { redirect: 'https://example.com/test' } });

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/external-redirect' }));

      rerenderWithNewRouter();

      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('ignores invalid external redirects', async () => {
      renderSuccess({ query: { redirect: 'javascript:alert(1)' } });

      await screen.findByText('Thank you! 🎉');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('waits for the payment intent check before following the external redirect', async () => {
      let resolvePaymentIntent;
      mockRetrievePaymentIntent.mockReturnValue(new Promise(resolve => (resolvePaymentIntent = resolve)));

      renderSuccess({ query: { ...stripeReturnQuery, redirect: 'https://example.com/test' } });

      await waitFor(() => expect(mockRetrievePaymentIntent).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();

      resolvePaymentIntent({ paymentIntent: { status: 'succeeded' } });

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/external-redirect' }));
    });

    it('still follows the external redirect when the payment intent lookup fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRetrievePaymentIntent.mockRejectedValue(new Error('Network error'));

      renderSuccess({ query: { ...stripeReturnQuery, redirect: 'https://example.com/test' } });

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/external-redirect' }));
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
