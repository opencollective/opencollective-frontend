import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';
import { withRequiredProviders } from '../../test/providers';

import { ConvertToOrganization } from './ConvertToOrganization';

// The modal is not the subject of these tests and requires a full V2 account from the dashboard context
jest.mock('./ConvertToOrganizationModal', () => ({
  ConvertToOrganizationModal: ({ open }: { open: boolean }) => (
    <div data-testid="convert-to-organization-modal" data-open={String(open)} />
  ),
}));

const renderComponent = (collective: Partial<GraphQLV1Collective> = {}) =>
  render(
    withRequiredProviders(
      <ConvertToOrganization
        collective={{
          id: 1,
          slug: 'my-collective',
          name: 'My Collective',
          legalName: 'My Collective',
          imageUrl: '',
          type: 'COLLECTIVE',
          policies: { publicId: 'pol-1' },
          ...collective,
        }}
      />,
    ),
  );

const getConvertButton = () => screen.getByRole('button', { name: 'Convert to Organization' });
const getModal = () => screen.getByTestId('convert-to-organization-modal');

describe('ConvertToOrganization', () => {
  it('blocks the conversion when the account is archived', async () => {
    renderComponent({ isArchived: true });

    expect(
      await screen.findByText(
        'This account has been archived. Please unarchive it before converting to an Organization.',
      ),
    ).toBeInTheDocument();
    expect(getConvertButton()).toBeDisabled();
    expect(getModal()).toHaveAttribute('data-open', 'false');
  });

  it('gives priority to the archived block reason', async () => {
    renderComponent({ isArchived: true, host: { id: 2, slug: 'my-host', name: 'My Host' } as GraphQLV1Collective });

    expect(
      await screen.findByText(
        'This account has been archived. Please unarchive it before converting to an Organization.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('You must leave your Fiscal Host before converting to an Organization.'),
    ).not.toBeInTheDocument();
  });

  it('allows the conversion for an account that is not archived', () => {
    renderComponent();

    expect(screen.queryByText(/before converting to an Organization/)).not.toBeInTheDocument();
    expect(getConvertButton()).toBeEnabled();
  });
});
