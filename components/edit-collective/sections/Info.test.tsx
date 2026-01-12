import React from 'react';
import type { QueryResult } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

import { type AccountTaxInformationQuery, AccountType } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../../test/providers';

import Info, { infoSettingsDashboardQuery } from './Info';

// Heavy HTML editor is not needed for this test; stub them
jest.mock('../../../components/RichTextEditor', () => () => <div data-testid="rich-text-editor-mock" />);
jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({}));

type AccountFromQuery = QueryResult<AccountTaxInformationQuery>['data']['account'];

// Build a MockedProvider mocks entry that returns the given account for Info's query
const buildQueryMock = (account: AccountFromQuery) => ({
  request: {
    query: infoSettingsDashboardQuery,
    variables: { id: account.id },
  },
  result: {
    data: {
      account: {
        __typename: 'Account',
        settings: {},
        socialLinks: [],
        location: null,
        tags: [],
        longDescription: null,
        description: null,
        isActive: false,
        isHost: false,
        currency: 'USD',
        image: null,
        imageUrl: null,
        type: AccountType.COLLECTIVE,
        id: 'acc1',
        slug: 'acc1',
        name: 'Account 1',
        legalName: 'Account 1',
        legacyId: 1,
        startsAt: null,
        endsAt: null,
        timezone: null,
        ...account,
      },
    },
  },
});

const renderInfo = (accountFromQuery: AccountFromQuery) => {
  const ui = (
    <MockedProvider mocks={[buildQueryMock(accountFromQuery)]}>
      <Info account={{ id: accountFromQuery.id, slug: accountFromQuery.slug }} />
    </MockedProvider>
  );
  return render(withRequiredProviders(ui));
};

const waitForComponentToLoad = async () => {
  await screen.findByText('Display name'); // This field is always present
};

describe('Info - Editing currency', () => {
  it('is not allowed if the collective is active', async () => {
    // @ts-expect-error - isActive is not in the Bot type
    renderInfo({ type: AccountType.COLLECTIVE, isActive: true, isHost: false, currency: 'USD' });

    await waitForComponentToLoad();
    expect(screen.getByTestId('organization-currency-trigger')).toHaveAttribute('data-disabled');
  });

  it('is not allowed if the fund is active', async () => {
    renderInfo({
      id: 'acc2',
      slug: 'acc2',
      type: AccountType.FUND,
      // @ts-expect-error - isActive is not in the Bot type
      isActive: true,
      isHost: false,
      currency: 'USD',
    });

    await waitForComponentToLoad();
    expect(screen.getByTestId('organization-currency-trigger')).toHaveAttribute('data-disabled');
  });

  it('is not allowed if host account', async () => {
    renderInfo({
      id: 'acc3',
      slug: 'acc3',
      type: AccountType.ORGANIZATION,
      // @ts-expect-error - isActive is not in the Bot type
      isActive: false,
      isHost: true,
      currency: 'USD',
    });

    await waitForComponentToLoad();
    expect(screen.getByTestId('organization-currency-trigger')).toHaveAttribute('data-disabled');
  });

  it('is not displayed for events', async () => {
    renderInfo({
      id: 'acc4',
      slug: 'acc4',
      type: AccountType.EVENT,
      // @ts-expect-error - isActive is not in the Bot type
      isActive: false,
      isHost: false,
      currency: 'USD',
    });

    await waitForComponentToLoad();
    expect(screen.queryByTestId('organization-currency-trigger')).not.toBeInTheDocument();
  });

  it('is not displayed for projects', async () => {
    renderInfo({
      id: 'acc5',
      slug: 'acc5',
      type: AccountType.PROJECT,
      // @ts-expect-error - isActive is not in the Bot type
      isActive: false,
      isHost: false,
      currency: 'USD',
    });

    await waitForComponentToLoad();
    expect(screen.queryByTestId('organization-currency-trigger')).not.toBeInTheDocument();
  });

  it('is allowed for inactive accounts', async () => {
    renderInfo({
      id: 'acc6',
      slug: 'acc6',
      type: AccountType.COLLECTIVE,
      // @ts-expect-error - isActive is not in the Bot type
      isActive: false,
      isHost: false,
      currency: 'USD',
    });

    await waitForComponentToLoad();
    expect(screen.getByTestId('organization-currency-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('organization-currency-trigger')).not.toHaveAttribute('data-disabled');
  });
});
