import '@testing-library/jest-dom';

import React from 'react';
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { NextPageContext } from 'next';

import { withRequiredProviders } from '../../../test/providers';

import EmbedContributionFlowPage from '../../../pages/embed/contribution-flow';
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

const mockThemeCollective = jest.fn();
jest.mock('../../CollectiveThemeProvider', () => ({
  __esModule: true,
  default: ({ collective, children }: any) => {
    mockThemeCollective(collective);
    return children;
  },
}));
jest.mock('../../EmbeddedPage', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="embedded-page">{children}</div>,
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

const renderPage = (mocks, { tierId = null, queryParams = {} } = {}) =>
  render(
    withRequiredProviders(
      <MockedProvider mocks={mocks} cache={cache()}>
        <EmbedContributionFlowPage
          collectiveSlug="my-event"
          tierId={tierId}
          error={undefined}
          queryParams={queryParams}
        />
      </MockedProvider>,
    ),
  );

const lastContainerProps = () => mockContainerProps.mock.calls[mockContainerProps.mock.calls.length - 1][0];

const postedEvents = (postMessage: jest.SpyInstance) => postMessage.mock.calls.map(([message]) => message.event);

describe('EmbedContributionFlowPage', () => {
  let postMessage: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggedInUser = null;
    mockRouter = { query: {}, asPath: '/', push: mockPush, replace: mockReplace };
    // In jsdom, `window.parent` is `window`
    postMessage = jest.spyOn(window, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    postMessage.mockRestore();
  });

  describe('parent slug fix-up', () => {
    it('adds the missing parent slug under the /embed prefix', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', verb: 'donate', step: 'payment', useTheme: 'true' };
      mockRouter.asPath = '/embed/my-event/donate/payment?useTheme=true';

      renderPage([buildQueryMock()]);

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush).toHaveBeenCalledWith(
        {
          pathname: '/embed/parent-collective/events/my-event/donate/payment',
          query: { verb: 'donate', step: 'payment', useTheme: 'true' },
        },
        null,
        { shallow: true },
      );
    });

    it('keeps the tier segments of the embed URL', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', tierSlug: 'vip', tierId: '42', step: 'details' };
      mockRouter.asPath = '/embed/my-event/contribute/vip-42/details';

      renderPage([buildQueryMock({ tierId: 42, tier: buildTier() })], { tierId: 42 });

      await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
      expect(mockPush.mock.calls[0][0].pathname).toBe(
        '/embed/parent-collective/events/my-event/contribute/vip-42/details',
      );
    });

    it('waits for the account to load and skips URLs that already have the parent slug', async () => {
      mockRouter.query = { parentCollectiveSlug: 'parent-collective', collectiveSlug: 'my-event', verb: 'donate' };
      mockRouter.asPath = '/embed/parent-collective/events/my-event/donate';

      renderPage([buildQueryMock()]);

      expect(mockPush).not.toHaveBeenCalled();
      await screen.findByTestId('contribution-flow');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Stripe loading', () => {
    it('loads Stripe when the host supports credit cards', async () => {
      renderPage([buildQueryMock({ account: buildEvent({ supportedPaymentMethods: ['CREDIT_CARD'] }) })]);

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
    });

    it('never blocks the success step, even when the tier is now sold out', async () => {
      mockRouter.query = { collectiveSlug: 'my-event', step: 'success', OrderId: 'order-id' };

      renderPage([buildQueryMock({ tierId: 42, tier: buildTier({ availableQuantity: 0 }) })], { tierId: 42 });

      expect(await screen.findByTestId('contribution-flow')).toBeInTheDocument();
      expect(screen.queryByTestId('contribution-blocker')).not.toBeInTheDocument();
    });
  });

  it('renders the contribution flow in embed mode', async () => {
    renderPage([buildQueryMock({ me: buildMe() })]);

    await screen.findByTestId('contribution-flow');
    const props = lastContainerProps();
    expect(props.isEmbed).toBe(true);
    expect(props.collective).toMatchObject({ id: 'event-id' });
    expect(props.host).toMatchObject({ id: 'host-id' });
    expect(props.contributorProfiles).toHaveLength(1);
  });

  it('only applies the collective theme when `useTheme` is set', async () => {
    const { unmount } = renderPage([buildQueryMock()], { queryParams: { useTheme: true } });
    await screen.findByTestId('contribution-flow');
    expect(mockThemeCollective).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'event-id' }));
    unmount();

    mockThemeCollective.mockClear();
    renderPage([buildQueryMock()]);
    await screen.findByTestId('contribution-flow');
    expect(mockThemeCollective).toHaveBeenLastCalledWith(null);
  });

  describe('parent window messages', () => {
    it('posts `initialized` on mount', () => {
      renderPage([buildQueryMock()]);

      expect(postMessage).toHaveBeenCalledWith(
        { event: 'initialized', size: { height: expect.any(Number), width: expect.any(Number) } },
        '*',
      );
    });

    it('posts `stepChange` when the contribution flow changes step', async () => {
      renderPage([buildQueryMock()]);
      await screen.findByTestId('contribution-flow');

      act(() => lastContainerProps().onStepChange('payment'));

      expect(postMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          event: 'stepChange',
          payload: { step: 'payment', height: expect.any(Number), width: expect.any(Number) },
        }),
        '*',
      );
    });

    it('posts `success` with a trimmed order payload', async () => {
      renderPage([buildQueryMock()]);
      await screen.findByTestId('contribution-flow');

      act(() =>
        lastContainerProps().onSuccess({
          id: 'order-id',
          legacyId: 123,
          status: 'PAID',
          frequency: 'ONETIME',
          amount: { __typename: 'Amount', value: 10, valueInCents: 1000, currency: 'USD' },
          platformTipAmount: { __typename: 'Amount', value: 1, valueInCents: 100, currency: 'USD' },
          tier: { __typename: 'Tier', id: 'tier-id', name: 'VIP', slug: 'vip' },
          fromAccount: { __typename: 'Individual', id: 'from-id', slug: 'me', name: 'Me' },
          toAccount: { __typename: 'Event', id: 'event-id', slug: 'my-event', name: 'My Event' },
          membership: { id: 'membership-id', publicMessage: 'secret' },
        }),
      );

      expect(postMessage).toHaveBeenLastCalledWith(
        {
          event: 'success',
          size: { height: expect.any(Number), width: expect.any(Number) },
          payload: {
            order: {
              id: 'order-id',
              legacyId: 123,
              status: 'PAID',
              frequency: 'ONETIME',
              amount: { value: 10, valueInCents: 1000, currency: 'USD' },
              platformTipAmount: { value: 1, valueInCents: 100, currency: 'USD' },
              tier: { id: 'tier-id' },
              fromAccount: { id: 'from-id' },
              toAccount: { id: 'event-id' },
            },
          },
        },
        '*',
      );
    });

    it('posts `resized` when the window is resized, until unmounted', async () => {
      const { unmount } = renderPage([buildQueryMock()]);

      window.dispatchEvent(new Event('resize'));
      expect(postedEvents(postMessage)).toContain('resized');

      unmount();
      postMessage.mockClear();
      window.dispatchEvent(new Event('resize'));
      expect(postMessage).not.toHaveBeenCalled();
    });
  });

  it('shows the error page when the account does not exist', async () => {
    renderPage([buildQueryMock({ account: null })]);

    expect(await screen.findByTestId('error-page')).toHaveTextContent('NOT_FOUND');
  });

  it('refetches the account when the user logs in', async () => {
    const mocks = [buildQueryMock(), buildQueryMock({ me: buildMe() })];
    const { rerender } = renderPage(mocks);
    await screen.findByTestId('contribution-flow');
    expect(lastContainerProps().contributorProfiles).toHaveLength(0);

    mockLoggedInUser = { id: 1 };
    rerender(
      withRequiredProviders(
        <MockedProvider mocks={mocks} cache={cache()}>
          <EmbedContributionFlowPage collectiveSlug="my-event" tierId={null} error={undefined} queryParams={{}} />
        </MockedProvider>,
      ),
    );

    await waitFor(() => expect(lastContainerProps().contributorProfiles).toHaveLength(1));
  });

  describe('getInitialProps', () => {
    it('allows framing and decodes the embed query parameters', () => {
      const res = { removeHeader: jest.fn() };
      const props = EmbedContributionFlowPage.getInitialProps({
        query: {
          collectiveSlug: 'my-event',
          tierId: '42',
          error: 'Oops',
          useTheme: 'true',
          hideFAQ: 'true',
          backgroundColor: '#123456',
        },
        res,
      } as unknown as NextPageContext);

      expect(res.removeHeader).toHaveBeenCalledWith('X-Frame-Options');
      expect(props).toMatchObject({ collectiveSlug: 'my-event', tierId: 42, error: 'Oops' });
      expect(props.queryParams).toMatchObject({ useTheme: true, hideFAQ: true, backgroundColor: '#123456' });
    });

    it('prefers the event slug and handles missing tier IDs', () => {
      const props = EmbedContributionFlowPage.getInitialProps({
        query: { collectiveSlug: 'parent-collective', eventSlug: 'my-event' },
      } as unknown as NextPageContext);

      expect(props).toMatchObject({ collectiveSlug: 'my-event', tierId: null });
    });
  });
});
