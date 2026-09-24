import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import { listTierQuery } from '../tiers/EditTierModal';

import Tickets from './Tickets';

jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({}));

const createListTierQueryMock = (accountSlug: string, tiers = [], supportedTierTypes: string[] = []) => ({
  request: {
    query: listTierQuery,
    variables: { accountSlug, tiersOnlyValid: false },
  },
  result: {
    data: {
      account: {
        __typename: 'Event',
        id: `acc-${accountSlug}`,
        supportedTierTypes,
        tiers: {
          __typename: 'TierCollection',
          nodes: tiers,
        },
      },
    },
  },
});

describe('Tickets section', () => {
  it('shows explanatory message and hides Create Ticket when TICKET is not in supportedTierTypes', async () => {
    const collective = {
      id: 1,
      slug: 'test-event',
      legacyId: 1,
      type: 'EVENT',
      settings: {},
      supportedTierTypes: ['TIER', 'DONATION', 'MEMBERSHIP'],
    };

    const mocks = [createListTierQueryMock('test-event', [], ['TIER', 'DONATION', 'MEMBERSHIP'])];

    render(
      withRequiredProviders(
        <MockedProvider mocks={mocks}>
          <Tickets collective={collective} />
        </MockedProvider>,
      ),
    );

    await waitFor(() => {
      expect(screen.getByText(/Event tickets are disabled by your fiscal host/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Create Ticket')).not.toBeInTheDocument();
  });

  it('shows Create Ticket button when TICKET is in supportedTierTypes', async () => {
    const collective = {
      id: 1,
      slug: 'test-event',
      legacyId: 1,
      type: 'EVENT',
      settings: {},
      supportedTierTypes: ['TIER', 'DONATION', 'MEMBERSHIP', 'TICKET'],
    };

    const mocks = [createListTierQueryMock('test-event', [], ['TIER', 'DONATION', 'MEMBERSHIP', 'TICKET'])];

    render(
      withRequiredProviders(
        <MockedProvider mocks={mocks}>
          <Tickets collective={collective} />
        </MockedProvider>,
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('Create Ticket')).toBeInTheDocument();
    });
  });
});
