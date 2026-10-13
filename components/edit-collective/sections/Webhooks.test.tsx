import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';

import { withRequiredProviders } from '../../../test/providers';

import { toast } from '../../ui/useToast';

import Webhooks, { deleteWebhookMutation, editCollectiveWebhooksQuery } from './Webhooks';

jest.mock('../../ui/useToast', () => ({ toast: jest.fn() }));

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

  it('reports the save error and keeps the form when the reload after it fails', async () => {
    renderWebhooks([
      { request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } }, result: { data: { account } } },
      {
        request: { query: deleteWebhookMutation, variables: { webhook: { id: 'webhook-1' } } },
        result: { errors: [new GraphQLError('Webhook could not be deleted')] },
      },
      { request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } }, error: new Error('Network error') },
    ]);

    fireEvent.click(await screen.findByTitle('Remove webhook'));
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Webhook could not be deleted' })),
    );
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
    expect(screen.queryByText('Network error')).not.toBeInTheDocument();
  });
});
