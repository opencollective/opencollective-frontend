import '@testing-library/jest-dom';

import React from 'react';
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import ContributionFlowPage from '../../../pages/contribution-flow';
import { contributionFlowAccountQuery } from '../graphql/queries';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockRouter = { query: {} as Record<string, string>, asPath: '/', push: mockPush, replace: mockReplace };
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
  withRouter: (Component: any) => Component,
  default: { router: null, events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() } },
}));

let mockLoggedInUser = null;
jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({
  LoggedInUser: mockLoggedInUser,
  loadingLoggedInUser: false,
}));

const mockLoadStripe = jest.fn();
jest.mock('../../StripeProvider', () => ({ useStripeLoader: () => ({ loadStripe: mockLoadStripe }) }));

const mockContainerProps = jest.fn();
jest.mock('../index', () => ({
  __esModule: true,
  default: (props: any) => {
    mockContainerProps(props);
    return <div data-testid="contribution-flow" />;
  },
}));

jest.mock('../ContributionBlocker', () => ({
  ...jest.requireActual('../ContributionBlocker'),
  __esModule: true,
  default: ({ blocker }: any) => <div data-testid="contribution-blocker">{blocker.reason}</div>,
}));

jest.mock('../../Page', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="page">{children}</div>,
}));
jest.mock('../../ErrorPage', () => ({
  __esModule: true,
  default: ({ error }: any) => <div data-testid="error-page">{error?.type}</div>,
}));
jest.mock('../../../pages/404', () => ({ __esModule: true, default: () => <div data-testid="not-found-page" /> }));

const cache = () =>
  new InMemoryCache({
    possibleTypes: {
      Account: ['Collective', 'Host', 'Individual', 'Fund', 'Project', 'Event', 'Organization'],
      AccountWithHost: ['Collective', 'Event', 'Fund', 'Project'],
      AccountWithParent: ['Event', 'Project'],
      AccountWithContributions: ['Collective', 'Organization', 'Event', 'Fund', 'Project', 'Host'],
    },
  });

const buildHost = (supportedPaymentMethods = ['CREDIT_CARD']) => ({
  __typename: 'Host',
  id: 'host-id',
  legacyId: 1,
  slug: 'host',
  name: 'Host',
  settings: {},
  contributionPolicy: null,
  location: { __typename: 'Location', id: 'host-location', country: 'US' },
  paypalClientId: null,
  supportedPaymentMethods,
  manualPaymentProviders: [],
  payoutMethods: [],
});

const buildEvent = ({ supportedPaymentMethods = undefined } = {}) => ({
  __typename: 'Event',
  id: 'event-id',
  legacyId: 2,
  slug: 'my-event',
  type: 'EVENT',
  name: 'My Event',
  currency: 'USD',
  settings: {},
  twitterHandle: null,
  description: null,
  imageUrl: null,
  backgroundImageUrl: null,
  isHost: false,
  isActive: true,
  location: { __typename: 'Location', id: 'event-location', country: 'US' },
  features: { __typename: 'CollectiveFeatures', id: 'features', RECEIVE_FINANCIAL_CONTRIBUTIONS: 'AVAILABLE' },
  contributionPolicy: null,
  platformContributionAvailable: true,
  contributors: { __typename: 'ContributorCollection', totalCount: 0, nodes: [] },
  hostFeePercent: 5,
  host: buildHost(supportedPaymentMethods),
  parent: {
    __typename: 'Collective',
    id: 'parent-id',
    slug: 'parent-collective',
    name: 'Parent',
    settings: {},
    imageUrl: null,
    backgroundImageUrl: null,
    location: { __typename: 'Location', id: 'parent-location', country: 'US' },
    contributionPolicy: null,
  },
  endsAt: null,
  policies: {
    __typename: 'Policies',
    id: 'policies',
    CONTRIBUTOR_INFO_THRESHOLDS: { __typename: 'ContributorInfoThresholds', legalName: null, address: null },
  },
});

const buildTier = ({ availableQuantity = null } = {}) => ({
  __typename: 'Tier',
  id: 'tier-id',
  legacyId: 42,
  type: 'TICKET',
  name: 'VIP',
  slug: 'vip',
  description: null,
  customFields: null,
  availableQuantity,
  singleTicket: false,
  requireAddress: false,
  maxQuantity: null,
  endsAt: null,
  amount: { __typename: 'Amount', valueInCents: 1000, currency: 'USD' },
  amountType: 'FIXED',
  minimumAmount: { __typename: 'Amount', valueInCents: null, currency: 'USD' },
  interval: null,
  presets: null,
});

const buildMe = () => ({
  __typename: 'Individual',
  id: 'me-id',
  contributorProfiles: [
    {
      __typename: 'ContributorProfile',
      account: {
        __typename: 'Individual',
        id: 'me-id',
        name: 'Me',
        legalName: null,
        slug: 'me',
        type: 'INDIVIDUAL',
        imageUrl: null,
        isIncognito: false,
        email: 'me@example.com',
        isGuest: false,
        location: null,
      },
      totalContributedToHost: { __typename: 'Amount', valueInCents: 0, currency: 'USD' },
    },
  ],
});

const buildQueryMock = ({ account = buildEvent(), tier = undefined, tierId = null, me = null } = {}) => ({
  request: {
    query: contributionFlowAccountQuery,
    variables: { collectiveSlug: 'my-event', tierId, includeTier: Boolean(tierId) },
  },
  result: { data: { account, me, ...(tierId ? { tier } : {}) } },
});

const renderPage = (mocks, { tierId = null } = {}) =>
  render(
    withRequiredProviders(
      <MockedProvider mocks={mocks} cache={cache()}>
        <ContributionFlowPage collectiveSlug="my-event" tierId={tierId} error={undefined} />
      </MockedProvider>,
    ),
  );

const lastContainerProps = () => mockContainerProps.mock.calls[mockContainerProps.mock.calls.length - 1][0];

describe('ContributionFlowPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggedInUser = null;
    mockRouter = { query: {}, asPath: '/', push: mockPush, replace: mockReplace };
  });

  describe('parent slug fix-up', () => {
    it('keeps the tier checkout path and drops tier route params when adding the missing parent slug', async () => {
      mockRouter.query = {
        collectiveSlug: 'my-event',
        verb: 'contribute',
        tierSlug: 'vip',
        tierId: '42',
        step: 'payment',
        amount: '1000',
      };

      renderPage([buildQueryMock({ tierId: 42, tier: buildTier() })], { tierId: 42 });

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush).toHaveBeenCalledWith(
        {
          pathname: '/parent-collective/events/my-event/contribute/vip-42/checkout/payment',
          query: { amount: '1000' },
        },
        null,
        { shallow: true },
      );
    });

    it('uses the verb route when there is no tier', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', verb: 'donate', step: 'details', interval: 'month' };

      renderPage([buildQueryMock()]);

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush).toHaveBeenCalledWith(
        { pathname: '/parent-collective/events/my-event/donate/details', query: { interval: 'month' } },
        null,
        { shallow: true },
      );
    });

    it('does not redirect when the URL already has the parent slug', async () => {
      mockRouter.query = { parentCollectiveSlug: 'parent-collective', collectiveSlug: 'my-event', verb: 'donate' };

      renderPage([buildQueryMock()]);

      await screen.findByTestId('contribution-flow');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('waits for the account to load before redirecting', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', verb: 'donate', step: 'details' };

      renderPage([buildQueryMock()]);

      // Still loading: there's no account to build the parent URL from yet
      expect(mockPush).not.toHaveBeenCalled();
      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    });
  });

  describe('Stripe loading', () => {
    it('loads Stripe when the host supports credit cards', async () => {
      renderPage([buildQueryMock({ account: buildEvent({ supportedPaymentMethods: ['CREDIT_CARD', 'PAYPAL'] }) })]);

      await waitFor(() => expect(mockLoadStripe).toHaveBeenCalled());
    });

    it('does not load Stripe when the host does not support credit cards', async () => {
      renderPage([buildQueryMock({ account: buildEvent({ supportedPaymentMethods: ['PAYPAL'] }) })]);

      await screen.findByTestId('contribution-flow');
      expect(mockLoadStripe).not.toHaveBeenCalled();
    });
  });

  describe('contribution blocker', () => {
    it('blocks the contribution when the tier is sold out', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', step: 'details' };

      renderPage([buildQueryMock({ tierId: 42, tier: buildTier({ availableQuantity: 0 }) })], { tierId: 42 });

      expect(await screen.findByTestId('contribution-blocker')).toHaveTextContent('TIER_EMPTY');
      expect(screen.queryByTestId('contribution-flow')).not.toBeInTheDocument();
    });

    it('never blocks the success step, even when the tier is now sold out', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', step: 'success', OrderId: 'order-id' };

      renderPage([buildQueryMock({ tierId: 42, tier: buildTier({ availableQuantity: 0 }) })], { tierId: 42 });

      expect(await screen.findByTestId('contribution-flow')).toBeInTheDocument();
      expect(screen.queryByTestId('contribution-blocker')).not.toBeInTheDocument();
    });
  });

  it('passes the account, host, tier and contributor profiles to the contribution flow', async () => {
    const me = buildMe();
    renderPage([buildQueryMock({ tierId: 42, tier: buildTier(), me })], { tierId: 42 });

    await screen.findByTestId('contribution-flow');
    const props = lastContainerProps();
    expect(props.collective).toMatchObject({ id: 'event-id', slug: 'my-event' });
    expect(props.host).toMatchObject({ id: 'host-id', slug: 'host' });
    expect(props.tier).toMatchObject({ id: 'tier-id', legacyId: 42 });
    expect(props.contributorProfiles).toHaveLength(1);
    expect(props.contributorProfiles[0].account.slug).toBe('me');
  });

  it('shows the error page when the account does not exist', async () => {
    renderPage([buildQueryMock({ account: null })]);

    expect(await screen.findByTestId('error-page')).toHaveTextContent('NOT_FOUND');
    expect(mockContainerProps).not.toHaveBeenCalled();
  });

  it('refetches the account when a logged-in user has no contributor profiles loaded', async () => {
    mockLoggedInUser = { id: 1 };

    renderPage([buildQueryMock(), buildQueryMock({ me: buildMe() })]);

    await waitFor(() => expect(lastContainerProps().contributorProfiles).toHaveLength(1));
  });
});
