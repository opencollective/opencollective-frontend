import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';

import { withRequiredProviders } from '../../../test/providers';

import Webhooks, { editCollectiveWebhooksQuery } from './Webhooks';

const SLUG = 'my-collective';

const account = {
  __typename: 'Collective',
  id: 'account-1',
  name: 'My Collective',
  type: 'COLLECTIVE',
  slug: SLUG,
  isHost: false,
  features: {
    __typename: 'CollectiveFeatures',
    id: 'features-1',
    RECEIVE_EXPENSES: 'ACTIVE',
    FUNDS_GRANTS_MANAGEMENT: 'DISABLED',
    VIRTUAL_CARDS: 'DISABLED',
    RECEIVE_FINANCIAL_CONTRIBUTIONS: 'ACTIVE',
    UPDATES: 'ACTIVE',
  },
  webhooks: {
    __typename: 'WebhookCollection',
    nodes: [
      {
        __typename: 'Webhook',
        id: 'webhook-1',
        activityType: 'COLLECTIVE_EXPENSE_CREATED',
        webhookUrl: 'https://example.com/hook',
      },
    ],
  },
};

const renderWebhooks = mocks =>
  render(
    withRequiredProviders(
      <MockedProvider mocks={mocks}>
        <Webhooks collectiveSlug={SLUG} />
      </MockedProvider>,
    ),
  );

describe('Webhooks', () => {
  it('lists the webhooks of the account', async () => {
    renderWebhooks([
      { request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } }, result: { data: { account } } },
    ]);
    expect(await screen.findByDisplayValue('example.com/hook')).toBeInTheDocument();
  });

  it('shows the query error instead of crashing', async () => {
    renderWebhooks([
      {
        request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } },
        result: { errors: [new GraphQLError('You need to be logged in to manage webhooks')] },
      },
    ]);
    expect(await screen.findByText('You need to be logged in to manage webhooks')).toBeInTheDocument();
  });
});
