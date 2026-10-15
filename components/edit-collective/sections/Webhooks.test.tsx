import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';

import { withRequiredProviders } from '../../../test/providers';

import { toast } from '../../ui/useToast';

import Webhooks, {
  createWebhookMutation,
  deleteWebhookMutation,
  editCollectiveWebhooksQuery,
  updateWebhookMutation,
} from './Webhooks';

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
  beforeEach(() => jest.mocked(toast).mockClear());

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

  it('does not create a webhook again when the reload after saving it fails', async () => {
    const newNode = {
      __typename: 'Webhook',
      id: 'webhook-2',
      activityType: 'ACTIVITY_ALL',
      webhookUrl: 'https://example.com/new',
    };
    const createRequest = {
      query: createWebhookMutation,
      variables: {
        webhook: { account: { id: 'account-1' }, activityType: 'ACTIVITY_ALL', webhookUrl: 'https://example.com/new' },
      },
    };
    renderWebhooks([
      { request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } }, result: { data: { account } } },
      { request: createRequest, result: { data: { createWebhook: { __typename: 'Webhook', id: 'webhook-2' } } } },
      { request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } }, error: new Error('Network error') },
      // Second save: only the reload is mocked, any mutation would fail with "No more mocked responses"
      {
        request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } },
        result: {
          data: {
            account: { ...account, webhooks: { ...account.webhooks, nodes: [...account.webhooks.nodes, newNode] } },
          },
        },
      },
    ]);

    await screen.findByDisplayValue('example.com/hook');
    fireEvent.click(screen.getByRole('button', { name: /New Webhook/ }));
    fireEvent.change(screen.getAllByRole('textbox').at(-1), { target: { value: 'example.com/new' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Network error' })));
    expect(toast).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue('example.com/new')).toBeInTheDocument();
  });

  it('keeps an http URL when only the activity changes', async () => {
    const httpAccount = {
      ...account,
      webhooks: {
        ...account.webhooks,
        nodes: [{ ...account.webhooks.nodes[0], webhookUrl: 'http://example.com/hook' }],
      },
    };
    const updatedNode = {
      __typename: 'Webhook',
      id: 'webhook-1',
      activityType: 'ACTIVITY_ALL',
      webhookUrl: 'http://example.com/hook',
    };
    const updateResult = jest.fn(() => ({ data: { updateWebhook: { __typename: 'Webhook', id: 'webhook-1' } } }));
    renderWebhooks([
      {
        request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } },
        result: { data: { account: httpAccount } },
      },
      {
        request: {
          query: updateWebhookMutation,
          variables: {
            webhook: { id: 'webhook-1', activityType: 'ACTIVITY_ALL', webhookUrl: 'http://example.com/hook' },
          },
        },
        result: updateResult,
      },
      {
        request: { query: editCollectiveWebhooksQuery, variables: { slug: SLUG } },
        result: { data: { account: { ...httpAccount, webhooks: { ...httpAccount.webhooks, nodes: [updatedNode] } } } },
      },
    ]);

    await screen.findByDisplayValue('example.com/hook');
    fireEvent.keyDown(screen.getByLabelText('Activity'), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'All' }));
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    // An https URL would not match the mocked mutation and fail the save
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
    // The reload alone would also show the updated node: check that the update itself ran
    expect(updateResult).toHaveBeenCalledTimes(1);
  });
});
