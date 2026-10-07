import '@testing-library/jest-dom';

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import ContributionFlowSuccess from '../ContributionFlowSuccess';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockRouter = {
  isReady: true,
  query: {} as Record<string, string>,
  push: mockPush,
  replace: mockReplace,
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
  withRouter: (Component: any) => Component,
  default: {
    router: {
      push: (...args: any[]) => mockPush(...args),
      replace: (...args: any[]) => mockReplace(...args),
    },
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  },
}));

const mockOrder = {
  id: 'order-id',
  legacyId: 123,
  status: 'PAID',
  frequency: 'ONETIME',
  amount: { value: 10, currency: 'USD' },
  fromAccount: { slug: 'user-slug' },
  toAccount: { slug: 'collective-slug', name: 'Collective' },
  tier: null,
};

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: () => ({ data: { order: mockOrder }, loading: false }),
  };
});

const mockRetrievePaymentIntent = jest.fn();
jest.mock('../../../lib/stripe', () => ({
  getStripe: jest.fn(() => Promise.resolve({ retrievePaymentIntent: mockRetrievePaymentIntent })),
}));

jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({
  LoggedInUser: null,
  loadingLoggedInUser: false,
}));

describe('ContributionFlowSuccess', () => {
  const collective = { id: 1, slug: 'collective-slug', name: 'Collective' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = {
      isReady: true,
      query: {},
      push: mockPush,
      replace: mockReplace,
    };
  });

  it('redirects to payment step with router.replace once on stripe error, even when router reference changes', async () => {
    mockRouter = {
      isReady: true,
      query: {
        OrderId: 'order-id',
        payment_intent_client_secret: 'pi_secret_123',
      },
      push: mockPush,
      replace: mockReplace,
    };

    mockRetrievePaymentIntent.mockResolvedValue({
      error: { message: 'Your card was declined.' },
    });

    const { rerender } = render(
      withRequiredProviders(<ContributionFlowSuccess collective={collective} isEmbed={false} />),
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    const redirectUrl = mockReplace.mock.calls[0][0];
    expect(redirectUrl).toContain('/collective-slug/donate/payment?error=Your+card+was+declined');

    // Simulate router reference changing (as happens during navigation)
    mockRouter = {
      ...mockRouter,
      push: mockPush,
      replace: mockReplace,
    };

    rerender(withRequiredProviders(<ContributionFlowSuccess collective={collective} isEmbed={false} />));

    // Ensure it was still only called once and push was not called
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('follows external redirect only once even when router reference changes', async () => {
    mockRouter = {
      isReady: true,
      query: {
        OrderId: 'order-id',
        redirect: 'https://example.com/test',
      },
      push: mockPush,
      replace: mockReplace,
    };

    const { rerender } = render(
      withRequiredProviders(<ContributionFlowSuccess collective={collective} isEmbed={false} />),
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/external-redirect',
      }),
    );

    // Simulate router reference changing
    mockRouter = {
      ...mockRouter,
      push: mockPush,
      replace: mockReplace,
    };

    rerender(withRequiredProviders(<ContributionFlowSuccess collective={collective} isEmbed={false} />));

    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
